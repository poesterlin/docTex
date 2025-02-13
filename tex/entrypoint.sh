#!/usr/bin/env bash

set -eo pipefail
shopt -s extglob globstar nullglob

info() {
  echo -e "\033[1;34m$1\033[0m"
}

warn() {
  echo "::warning :: $1"
}

error() {
  echo "::error :: $1"
  exit 1
}

if [[ -z "$INPUT_ROOT_FILE" ]]; then
  error "Input 'root_file' is missing."
fi

readarray -t root_file <<<"$INPUT_ROOT_FILE"

if [[ -n "$INPUT_WORKING_DIRECTORY" ]]; then
  if [[ ! -d "$INPUT_WORKING_DIRECTORY" ]]; then
    mkdir -p "$INPUT_WORKING_DIRECTORY"
  fi
  cd "$INPUT_WORKING_DIRECTORY"
fi

expanded_root_file=()
for pattern in "${root_file[@]}"; do
  expanded=($pattern)
  expanded_root_file+=("${expanded[@]}")
done
root_file=("${expanded_root_file[@]}")

INPUT_COMPILER="latexmk"
INPUT_ARGS="-pdf -file-line-error -shell-escape -interaction=nonstopmode -v"

IFS=' ' read -r -a args <<<"$INPUT_ARGS"

if [[ -n "$INPUT_EXTRA_FONTS" ]]; then
  readarray -t extra_fonts <<<"$INPUT_EXTRA_FONTS"
  expanded_extra_fonts=()
  for pattern in "${extra_fonts[@]}"; do
    expanded=($pattern)
    expanded_extra_fonts+=("${expanded[@]}")
  done
  extra_fonts=("${expanded_extra_fonts[@]}")

  mkdir -p "$HOME/.local/share/fonts/"

  for f in "${extra_fonts[@]}"; do
    if [[ -z "$f" ]]; then
      continue
    fi

    info "Install font $f"
    cp -r "$f" "$HOME/.local/share/fonts/"
  done

  fc-cache -fv
fi

exit_code=0

for f in "${root_file[@]}"; do
  if [[ -z "$f" ]]; then
    continue
  fi

  if [[ "$INPUT_WORK_IN_ROOT_FILE_DIR" = "true" ]]; then
    pushd "$(dirname "$f")" >/dev/null
    f="$(basename "$f")"
    info "Compile $f in $PWD"
  else
    info "Compile $f"
  fi

  if [[ ! -f "$f" ]]; then
    error "File '$f' cannot be found from the directory '$PWD'."
  fi

  # Clean auxiliary files
  info "Cleaning auxiliary files"
  latexmk -c "$f"

  # Run LaTeX *first* to generate the .bcf file
  info "Running LaTeX (first pass)"
  pdflatex "$f" || true  # Ignore errors on the first pass

  # Run Biber
  info "Running biber"
  biber "$(basename "$f" .tex)"

  # Now run latexmk, with a timeout
  info "Running latexmk with timeout"
  timeout 60s "$INPUT_COMPILER" "${args[@]}" "$f" || ret="$?" # Added timeout
  if [[ "$ret" -ne 0 ]]; then
    if [[ "$INPUT_CONTINUE_ON_ERROR" = "true" ]]; then
      exit_code="$ret"
    else
      exit "$ret"
    fi
  fi
done

exit "$exit_code"

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

log_command() {
  local start_time=$(date +%s)
  info "Running command: $*"
  "$@"
  local end_time=$(date +%s)
  local exit_code=$?
  local duration=$((end_time - start_time))
  info "Command '$*' finished in ${duration}s with exit code ${exit_code}"
  return $exit_code
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
  log_command latexmk -c "$f"

  # Run LaTeX (first pass)
  info "Running LaTeX (first pass)"
  log_command pdflatex --shell-escape "$f"

  # Run Biber
  info "Running biber"
  log_command biber "$(basename "$f" .tex)"

  # Run LaTeX (second pass)
  info "Running LaTeX (second pass)"
  log_command pdflatex --shell-escape "$f"

  # # Run LaTeX (third pass)
  # info "Running LaTeX (third pass)"
  # log_command pdflatex --shell-escape "$f"

  # Now run latexmk, with a timeout
  info "Running latexmk with timeout"
  if timeout 60s log_command "$INPUT_COMPILER" "${args[@]}" "$f"; then
    ret=0
  else
    ret=$?
  fi
  if [[ "$ret" -ne 0 ]]; then
    if [[ "$INPUT_CONTINUE_ON_ERROR" = "true" ]]; then
      exit_code="$ret"
    else
      exit "$ret"
    fi
  fi
done

exit "$exit_code"

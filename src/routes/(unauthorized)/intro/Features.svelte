<script lang="ts">
    const features = [
      {
        icon: 'ti ti-file-text',
        title: 'Smart Document Conversion',
        description: 'Import from Google Docs or Markdown and maintain all your formatting, citations, and structure.'
      },
      {
        icon: 'ti ti-quote',
        title: 'Citation Management',
        description: 'Automatically format citations and bibliography in any academic style (APA, MLA, Chicago, and more).'
      },
      {
        icon: 'ti ti-photo',
        title: 'Figure Handling',
        description: 'Seamlessly include figures, tables, and equations with automatic numbering and referencing.'
      },
      {
        icon: 'ti ti-template',
        title: 'Journal Templates',
        description: 'Access a wide range of pre-configured journal templates for quick formatting.'
      }
    ];
  </script>
  
  <section id="features" class="py-16 px-4 bg-gray-800">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-3xl font-bold text-center mb-12 text-white">
        Everything You Need for Academic Writing
      </h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {#each features as feature}
          <div class="p-6 rounded-lg bg-gray-900 border border-gray-700">
            <i class="{feature.icon} text-pink-400 text-3xl mb-4"></i>
            <h3 class="text-xl font-bold mb-2 text-white">{feature.title}</h3>
            <p class="text-gray-400">{feature.description}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>
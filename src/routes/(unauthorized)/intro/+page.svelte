<script lang="ts">
    import Hero from './Hero.svelte';
    import Features from './Features.svelte';
    import CTA from './CTA.svelte';
  </script>
  
  <main class="min-h-screen text-balance">
    <nav class="bg-gray-900 border-b border-gray-800 fixed w-full z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex-shrink-0">
            <span class="font-serif text-xl font-bold text-pink-400">DocTex</span>
          </div>
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-4">
              <a href="#features" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Features</a>
              <a href="#how-it-works" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">How it Works</a>
              <a class="bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-700 transition-colors" href="/login">
                Try Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  
    <Hero />
    <Features />
    <CTA />
  </main>

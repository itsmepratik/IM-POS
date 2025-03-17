module.exports = {
  onPreBuild: async ({ utils }) => {
    console.log('Using Bun for dependency installation');
    try {
      // Check if bun is installed
      await utils.run.command('bun --version');
      console.log('Bun is already installed');
    } catch (error) {
      console.log('Installing Bun...');
      await utils.run.command('npm install -g bun');
    }

    // Install dependencies with Bun
    console.log('Installing dependencies with Bun...');
    await utils.run.command('bun install');
  }
}; 
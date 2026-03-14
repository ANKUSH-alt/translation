async function test() {
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAZe32C_VmCLCW4xwK7Zg6F9m7bESA1a-M';
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      console.log(data.models.slice(0, 20).map(m => m.name).join('\n'));
    } else {
      console.log('No models found or error:', data);
    }
  } catch (e) {
    console.error('Fetch Error:', e.message);
  }
}
test();

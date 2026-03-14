async function test() {
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAZe32C_VmCLCW4xwK7Zg6F9m7bESA1a-M';
    const res = await fetch(url);
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Fetch Error:', e.message);
  }
}
test();

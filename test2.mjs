async function test() {
  const endpoints = [
    '/api/v1/assignment/student?code=B12QDQ',
    '/api/v1/assignment/B12QDQ',
    '/api/v1/assignments/B12QDQ',
    '/api/v1/assignment/student/B12QDQ',
    '/api/v2/assignment/B12QDQ',
    '/api/v1/student/assignment/B12QDQ',
    '/api/v1/assignment?code=B12QDQ',
    '/api/v1/assignment/code/B12QDQ',
    '/assignment/student?code=B12QDQ'
  ];
  for (const ep of endpoints) {
    try {
      const res = await fetch('https://production.getmarks.app' + ep);
      console.log(ep, res.status);
    } catch (e) {
      console.log(ep, e.message);
    }
  }
}
test();

export async function assertForStatus(response: Response) {
  if (response.status !== 200) {
    console.error(await response.text());
    throw new Error(
      `Request returned a non-200 status code: ${response.status}`
    );
  }
}

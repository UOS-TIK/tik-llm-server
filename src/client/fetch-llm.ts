export const fetchLlm = async <T extends object>(uri: string, body: T) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_LLM_API_URL}${uri}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.NEXT_PUBLIC_LLM_API_KEY || '',
    },
    body: JSON.stringify(body),
  });

  return response.json();
};

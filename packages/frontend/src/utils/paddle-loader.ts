export const loadPaddle = async (): Promise<any> => {
  if ((window as any).Paddle) {
    return (window as any).Paddle;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = () => {
      const paddle = (window as any).Paddle;
      if (paddle) {
        const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
        const environment = clientToken?.startsWith('test_')
          ? 'sandbox'
          : 'production';

        paddle.Environment.set(environment);
        paddle.Setup({
          token: clientToken,
          eventCallback: (data: any) => {
            console.log('Paddle Event:', data);
          },
        });
        resolve(paddle);
      } else {
        reject(new Error('Paddle SDK failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Paddle script'));
    document.body.appendChild(script);
  });
};

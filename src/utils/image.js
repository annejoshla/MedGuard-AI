// Downscale uploads so they fit in LocalStorage.
export const fileToSmallDataUrl = (file, max = 900) => new Promise((res, rej) => {
  const r = new FileReader(); r.onerror = rej;
  r.onload = () => {
    const img = new Image(); img.onerror = rej;
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', 0.6));
    };
    img.src = r.result;
  };
  r.readAsDataURL(file);
});

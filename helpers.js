const preloadImage = (url, callback) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
  
    // Once loaded, execute cb
    img.onload = function() {
      callback();
      resolve();
    };
  
    img.onerror = function () {
      console.error('Failed to load image:', url);
      reject();
    }
  });
}

export default preloadImage;
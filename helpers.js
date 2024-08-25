
const preloadImage = (url, callback) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;

    if (img.complete) {
      resolve();
      callback();
      return;
    }

    // Once loaded, execute cb
    img.onload = function() {
      console.log('Loaded');
      resolve();
      callback();
    };
  
    img.onerror = function () {
      console.error('Failed to load image:', url);
      reject();
    }
  });
}

export default preloadImage;
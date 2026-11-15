/**
 * Client-side photo compression utility for non-aisle questionnaire photos.
 * Ensures max long-side of 1600px and JPEG quality ~0.70.
 * Aisle photos for AI vision are NOT processed through this function.
 */
export async function compressQuestionnairePhoto(
  fileOrDataUrl: File | Blob | string,
  maxLongSide = 1600,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxLongSide) {
            height = Math.round((height * maxLongSide) / width);
            width = maxLongSide;
          }
        } else {
          if (height > maxLongSide) {
            width = Math.round((width * maxLongSide) / height);
            height = maxLongSide;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas context cannot be created
          resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : URL.createObjectURL(fileOrDataUrl));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => reject(err);

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

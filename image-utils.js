// Browse with appropriately sized copies; the zoom viewer uses the originals.
function responsiveImageData(source, sizes) {
  const entry = typeof productImageManifest !== 'undefined' && productImageManifest[source];
  if (!entry) return { src: source, srcset: '', sizes, width: 720, height: 900 };
  const fallback = entry.variants.find(image => image.width >= 640) || entry.variants.at(-1);
  return {
    src: fallback.src,
    srcset: entry.variants.map(image => `${image.src} ${image.width}w`).join(', '),
    sizes, width: entry.width, height: entry.height
  };
}

function imageAttributes(source, sizes) {
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const data = responsiveImageData(source, sizes);
  return `src="${escape(data.src)}" srcset="${escape(data.srcset)}" sizes="${escape(data.sizes)}" width="${data.width}" height="${data.height}" decoding="async" data-original="${escape(source)}" onerror="this.onerror=null;this.removeAttribute('srcset');this.src=this.dataset.original"`;
}

function setResponsiveImage(image, source, sizes) {
  const data = responsiveImageData(source, sizes);
  image.onerror = () => {
    image.onerror = null;
    image.removeAttribute('srcset');
    image.src = source;
  };
  image.width = data.width;
  image.height = data.height;
  image.decoding = 'async';
  image.sizes = data.sizes;
  image.srcset = data.srcset;
  image.src = data.src;
}

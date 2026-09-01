const inquiryParams = new URLSearchParams(window.location.search);
const inquiryProductId = Number.parseInt(inquiryParams.get('product'), 10);

const escapeInquiryHTML = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

if (Number.isInteger(inquiryProductId) && typeof productsData !== 'undefined') {
  const inquiryProduct = Object.values(productsData).flat().find(product => product.id === inquiryProductId);

  if (inquiryProduct) {
    const context = document.querySelector('#contact-product-context');
    const inquiryText = `I am interested in ${inquiryProduct.name}, product ${inquiryProduct.id}.`;
    const image = inquiryProduct.images?.[0] || '';
    const status = inquiryProduct.status === 'in-stock' ? 'Available' : 'Sold out';
    context.innerHTML = `
      <img ${imageAttributes(image, '88px')} alt="${escapeInquiryHTML(inquiryProduct.name)}" loading="lazy">
      <div>
        <span>Your selected piece</span>
        <a href="product.html?id=${inquiryProduct.id}">${escapeInquiryHTML(inquiryProduct.name)}</a>
        <p>$${Number(inquiryProduct.price).toFixed(2)} &nbsp; Product ${inquiryProduct.id} &nbsp; ${status}</p>
      </div>`;
    context.hidden = false;
    document.querySelector('#contact-email').href = `mailto:avantijewelsny@gmail.com?subject=${encodeURIComponent(`Product inquiry ${inquiryProduct.id}`)}&body=${encodeURIComponent(inquiryText)}`;
    document.querySelector('#contact-whatsapp').href = `https://wa.me/17186979678?text=${encodeURIComponent(inquiryText)}`;
  }
}

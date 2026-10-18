// Accessibility and responsive storefront interactions.
(() => {
  document.querySelectorAll('i[class*="fa-"]').forEach(icon => icon.setAttribute('aria-hidden', 'true'));
  document.querySelectorAll('.form-group').forEach(group => {
    const field = group.querySelector('input, textarea');
    if (field) group.querySelector('label')?.setAttribute('for', field.id);
  });
  const autofill = { custName: 'name', custPhone: 'tel-national', custEmail: 'email', custAddress: 'street-address', custCity: 'address-level2', custPincode: 'postal-code' };
  Object.entries(autofill).forEach(([id, value]) => document.getElementById(id)?.setAttribute('autocomplete', value));
  ['custPhone', 'custPincode'].forEach(id => document.getElementById(id)?.setAttribute('inputmode', 'numeric'));
  document.querySelectorAll('.quantity-selector').forEach(group => {
    const input = group.querySelector('input');
    const name = group.closest('.product-card').querySelector('h3').textContent;
    input.setAttribute('aria-label', `Quantity: ${name}`);
    group.querySelectorAll('button').forEach((button, index) => button.setAttribute('aria-label', `${index ? 'Increase' : 'Decrease'} quantity: ${name}`));
  });

  const menu = document.getElementById('mobileMenu');
  const menuButton = document.querySelector('.mobile-menu-btn');
  window.toggleMobileMenu = function () {
    const expanded = menu.classList.toggle('active');
    menuButton.setAttribute('aria-expanded', String(expanded));
    menuButton.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
    menuButton.querySelector('i').className = expanded ? 'fas fa-times' : 'fas fa-bars';
  };
  document.addEventListener('click', event => {
    if (menu.classList.contains('active') && !event.target.closest('#navbar')) toggleMobileMenu();
  });
  window.matchMedia('(min-width: 769px)').addEventListener('change', event => {
    if (event.matches && menu.classList.contains('active')) toggleMobileMenu();
  });

  // Give both shopping overlays keyboard focus containment and focus restoration.
  const cartPanel = document.getElementById('cartSidebar');
  const checkout = document.getElementById('checkoutModal');
  let previousFocus;
  const openPanel = panel => {
    previousFocus = document.activeElement;
    panel.inert = false;
    panel.setAttribute('aria-hidden', 'false');
    panel.querySelector('button')?.focus();
  };
  const closePanel = panel => {
    panel.inert = true;
    panel.setAttribute('aria-hidden', 'true');
    previousFocus?.focus();
  };
  const originalOpenCart = window.openCart;
  const originalCloseCart = window.closeCart;
  const originalOpenCheckout = window.openCheckout;
  const originalCloseCheckout = window.closeCheckout;
  window.openCart = () => { originalOpenCart(); openPanel(cartPanel); };
  window.closeCart = () => { originalCloseCart(); closePanel(cartPanel); };
  window.openCheckout = () => { originalOpenCheckout(); if (checkout.classList.contains('active')) openPanel(checkout); };
  window.closeCheckout = () => { originalCloseCheckout(); closePanel(checkout); };
  const originalGoToStep = window.goToStep;
  window.goToStep = step => {
    originalGoToStep(step);
    const heading = document.querySelector(`#step${step} h2`);
    heading.setAttribute('tabindex', '-1');
    if (checkout.classList.contains('active')) heading.focus();
  };
  document.addEventListener('keydown', event => {
    const panel = checkout.classList.contains('active') ? checkout : cartPanel.classList.contains('active') ? cartPanel : null;
    if (event.key === 'Escape') {
      if (panel === checkout) closeCheckout();
      else if (panel) closeCart();
      if (menu.classList.contains('active')) { toggleMobileMenu(); menuButton.focus(); }
    }
    if (event.key !== 'Tab' || !panel) return;
    const focusable = [...panel.querySelectorAll('button, a[href], input, textarea, select, [tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement))) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !focusable.includes(document.activeElement))) { event.preventDefault(); first?.focus(); }
  });
  checkout.addEventListener('click', event => { if (event.target === checkout) closeCheckout(); });
  const cartObserver = new MutationObserver(() => {
    document.getElementById('mobileCartCount').textContent = document.getElementById('cartCount').textContent;
    document.querySelectorAll('.cart-item-remove').forEach(button => button.setAttribute('aria-label', 'Remove item from cart'));
  });
  cartObserver.observe(document.getElementById('cartItems'), { childList: true, subtree: true });
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll('.mobile-bottom-nav a').forEach(link => {
        const active = link.hash === `#${entry.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-15% 0px -55% 0px' });
  document.querySelectorAll('main > section').forEach(section => sectionObserver.observe(section));
  document.querySelectorAll('.cat-tab').forEach(button => button.setAttribute('aria-pressed', String(button.classList.contains('active'))));
  const originalFilter = window.filterProducts;
  window.filterProducts = (category, button) => {
    originalFilter(category, button);
    document.querySelectorAll('.cat-tab').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
  };

  // Native dialog provides a functional product preview, including keyboard dismissal.
  const preview = document.getElementById('productPreview');
  document.querySelectorAll('.product-overlay button').forEach(button => {
    const card = button.closest('.product-card');
    button.removeAttribute('onclick');
    button.setAttribute('aria-label', `View ${card.querySelector('h3').textContent}, ${card.querySelector('.product-weight').textContent}`);
    button.addEventListener('click', () => {
      preview.querySelector('img').src = card.querySelector('img').src;
      preview.querySelector('img').alt = card.querySelector('img').alt;
      preview.querySelector('h2').textContent = card.querySelector('h3').textContent;
      preview.querySelector('.preview-weight').textContent = card.querySelector('.product-weight').textContent;
      preview.querySelector('.preview-price').textContent = card.querySelector('.price').textContent;
      preview.querySelector('.preview-description').textContent = card.dataset.category === 'tea'
        ? 'Premium tea powder from the Nilgiri hills. Rich in flavour and aroma. / நீலகிரி மலைகளின் தரமான தேயிலைத்தூள்.'
        : 'Pure natural honey collected from forests. / காடுகளில் சேகரிக்கப்படும் இயற்கை தேன்.';
      preview.querySelector('.add-to-cart-btn').onclick = () => { preview.close(); card.querySelector('.add-to-cart-btn').click(); };
      preview.showModal();
    });
  });
  preview.addEventListener('click', event => { if (event.target === preview && (event.offsetX < 0 || event.offsetY < 0 || event.offsetX > preview.clientWidth || event.offsetY > preview.clientHeight)) preview.close(); });
})();

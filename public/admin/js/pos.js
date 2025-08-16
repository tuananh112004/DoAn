
(function(){
  const codeReader = new ZXing.BrowserMultiFormatReader();
  const video = document.getElementById('videoPreview');
  const barcodeInput = document.getElementById('barcodeInput');
  const productInfo = document.getElementById('productInfo');
  const cartList = document.getElementById('cartList');
  const btnStart = document.getElementById('btnStartScan');
  const btnStop = document.getElementById('btnStopScan');
  const btnCreateOrder = document.getElementById('btnCreateOrder');

  const cart = new Map();
  let scanning = false;

  function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }

  async function startScan(){
    try {
      const devices = await codeReader.listVideoInputDevices();
      if (!devices || devices.length === 0) {
        alert('Không tìm thấy camera.');
        return;
      }
      const deviceId = devices[0].deviceId;
      scanning = true;
      codeReader.decodeFromVideoDevice(deviceId, video, (result, err) => {
        if (result && scanning) {
          scanning = false;
          stopScan();
          handleBarcode(result.getText());
        }
      });
    } catch(e) {
      console.error(e);
      alert('Không thể truy cập camera.');
    }
  }
  

  function stopScan(){
    try { codeReader.reset(); } catch(e) {}
    scanning = false;
  }

  function handleBarcode(text){
    if(!text) return;
    barcodeInput.value = text;
    lookup(text, true);
  }

  async function lookup(code, autoAdd = false){
    try {
      const res = await fetch(`/admin/pos/lookup-by-barcode?barcode=${encodeURIComponent(code)}`);
      if(!res.ok){
        productInfo.innerHTML = `<div class="text-danger">Không tìm thấy sản phẩm</div>`;
        return;
      }
      const data = await res.json();
      productInfo.innerHTML = `
        <div class="card">
          <div class="card-body d-flex align-items-center">
            <img src="${data.thumbnail || ''}" style="width:60px;height:60px;object-fit:cover;margin-right:10px"/>
            <div>
              <div><strong>${data.title}</strong></div>
              <div>Giá: ${formatPrice(data.price)}</div>
            </div>
            <div class="ml-auto">
              <button class="btn btn-sm btn-primary" id="btnAddToCart">Thêm</button>
            </div>
          </div>
        </div>`;
      document.getElementById('btnAddToCart').onclick = () => addToCart(data);
      if (autoAdd) addToCart(data);
    } catch(e) {
      console.error(e);
      productInfo.innerHTML = `<div class="text-danger">Lỗi tra cứu</div>`;
    }
  }

  function addToCart(prod){
    const existing = cart.get(prod.id) || { product: prod, quantity: 0 };
    existing.quantity += 1;
    cart.set(prod.id, existing);
    renderCart();
  }

  function renderCart(){
    const items = Array.from(cart.values());
    if(items.length === 0){
      cartList.innerHTML = '<div>Giỏ trống</div>';
      return;
    }
    const html = items.map(({product, quantity})=>{
      const discounted = product.price * (1 - (product.discountPercentage||0)/100);
      const total = discounted * quantity;
      return `
        <div class="d-flex align-items-center border p-2 mb-2">
          <div class="mr-2" style="width:40px;height:40px;overflow:hidden">
            <img src="${product.thumbnail||''}" style="width:100%;height:100%;object-fit:cover"/>
          </div>
          <div>
            <div><strong>${product.title}</strong></div>
            <div>Giá: ${formatPrice(discounted)}</div>
          </div>
          <div class="ml-auto d-flex align-items-center">
            <button class="btn btn-sm btn-outline-secondary" data-action="dec" data-id="${product.id}">-</button>
            <span class="mx-2">${quantity}</span>
            <button class="btn btn-sm btn-outline-secondary" data-action="inc" data-id="${product.id}">+</button>
            <span class="ml-3">${formatPrice(total)}</span>
          </div>
        </div>`;
    }).join('');
    cartList.innerHTML = html;
    cartList.querySelectorAll('button[data-action]').forEach(btn=>{
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        const item = cart.get(id);
        if(!item) return;
        if(action==='inc') item.quantity += 1;
        else item.quantity = Math.max(1, item.quantity - 1);
        cart.set(id, item);
        renderCart();
      }
    });
  }

  // Event bindings
  btnStart && (btnStart.onclick = startScan);
  btnStop && (btnStop.onclick = stopScan);
  barcodeInput && (barcodeInput.onkeydown = (e)=>{
    if(e.key==='Enter'){
      e.preventDefault();
      lookup(barcodeInput.value.trim(), true);
    }
  });
  btnCreateOrder && (btnCreateOrder.onclick = async ()=>{
    const items = Array.from(cart.values()).map(({product, quantity})=>({
      product_id: product.id,
      price: product.price,
      discountPercentage: product.discountPercentage||0,
      quantity
    }));
    if(items.length===0){ alert('Giỏ hàng trống'); return; }
    const res = await fetch('/admin/pos/order', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ products: items })
    });
    const data = await res.json();
    if(res.ok){
      alert('Tạo hóa đơn thành công');
      cart.clear();
      renderCart();
    } else {
      alert(data.message||'Lỗi tạo hóa đơn');
    }
  });
})();

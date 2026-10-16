/* Wishlist, customer account, login, registration, profile and order tracking. */

async function toggleWishlist(id, button) {

    if (!state.user || state.user.role !== 'customer') {

        toast('Please login as a customer to use Wishlist');

        location.hash = '#/login';

        return

    }

    try {

        const d = await api('/wishlist/toggle', { method: 'POST', body: JSON.stringify({ productId: id }) });

        state.user.wishlist = d.wishlist || [];

        save();

        if (button) {

            const active = d.wishlisted;

            button.classList.toggle('wishlisted', active);

            button.textContent = button.classList.contains('wishlist-detail') ? (active ? '♥ In Wishlist' : '♡ Add to Wishlist') : (active ? '♥' : '♡');

            button.title = active ? 'Remove from Wishlist' : 'Add to Wishlist'

        }

        toast(d.wishlisted ? 'Added to Wishlist' : 'Removed from Wishlist');

        renderHeaderOnly()

    } catch (e) {

        toast(e.message)

    }

}

async function wishlistPage() {

    if (!state.user || state.user.role !== 'customer') {

        return `<main class="page"><div class="container empty">Please <a href="#/login" style="color:var(--green)">login as a customer</a> to view your Wishlist.</div></main>`

    }

    const items = await api('/wishlist');

    return `<main class="page"><div class="container"><div class="section-head"><div><h1>My Wishlist</h1><p class="muted">Your saved products stay here until you remove them.</p></div></div>${items.length ? `<div class="products">${await productCards(items)}</div>` : '<div class="empty">Your Wishlist is empty.<br><br><a class="btn" href="#/products">Browse Products</a></div>'}</div></main>`

}

function renderHeaderOnly() {

    const app = document.querySelector('#app');

    if (app) {

        const headerEl = app.querySelector('.header');

        if (headerEl) {

            const current = location.hash;

            render().then(() => {

                if (location.hash !== current) location.hash = current

            })

        }

    }

}

async function ordersPage() {

    if (!state.user) return `<main class="page"><div class="container empty">Please <a href="#/login" style="color:var(--green)">login</a> to view your orders.</div></main>`;

    let os = await api('/orders');

    return `<main class="page"><div class="container"><h1>My Orders</h1>${os.length ? `<div class="customer-orders">${os.map(o => {

        let canTrack = o.trackingStatus === 'Out for Delivery';

        return `<div class="order-card"><div class="order-card-head"><div><b>Order #${o.id.slice(-8)}</b><small>${new Date(o.createdAt).toLocaleString()}</small></div><span class="status-pill">${esc(o.trackingStatus)}</span></div><div class="order-products">${(o.items || []).map(i => `<div class="order-product"><img src="${esc(i.image)}" alt="${esc(i.name)}"><div><b>${esc(i.name)}</b><small>Qty: ${i.quantity} · ₹${i.price}</small></div></div>`).join('')}</div><div class="order-card-foot"><strong>Total ₹${o.total}</strong>${canTrack ? `<a class="btn" href="#/order/${o.id}">Track Order</a>` : `<span class="track-wait">Tracking available when your order is Out for Delivery</span>`}</div></div>`

    }).join('')}</div>` : '<div class="empty">No orders yet.</div>'}</div></main>`

}

async function orderPage(id) {

    let o = await api('/orders/' + id);

    let canTrack = ['Out for Delivery', 'Delivered'].includes(o.trackingStatus);

    if (!canTrack) return `<main class="page"><div class="container"><h1>Order #${id.slice(-8)}</h1><div class="summary"><h3>${esc(o.trackingStatus)}</h3><p>Your live tracking will be available once the order is <b>Out for Delivery</b>.</p><p>Total: ₹${o.total} · Payment: ${esc(o.paymentMethod)}</p></div><a class="btn" href="#/orders">Back to Orders</a></div></main>`;

    let steps = ['Order Confirmed', 'Packed', 'Out for Delivery', 'Delivered'], timeline = o.timeline || [];

    return `<main class="page"><div class="container"><div class="track-top"><div><span class="auth-kicker">FreshCart Tracking</span><h1>Track Your Order</h1><p>Order #${id.slice(-8)} · ${new Date(o.createdAt).toLocaleString()}</p></div><span class="track-current">${esc(o.trackingStatus)}</span></div><div class="tracking-layout"><div class="tracking-main"><div class="track-card"><h3>Delivery Status</h3><div class="tracking-steps">${steps.map((st, idx) => {

        let reached = timeline.some(x => x.status === st), active = st === o.trackingStatus, t = timeline.filter(x => x.status === st).slice(-1)[0];

        return `<div class="track-step ${reached ? 'done' : ''} ${active ? 'current' : ''}"><div class="track-dot">${reached ? '✓' : idx + 1}</div><div><b>${st}</b><small>${t ? new Date(t.time).toLocaleString() : (active ? 'Current status' : 'Pending')}</small></div></div>`

    }).join('')}</div></div><div class="track-card"><h3>Items in this order</h3><div class="order-products">${(o.items || []).map(i => `<div class="order-product"><img src="${esc(i.image)}" alt="${esc(i.name)}"><div><b>${esc(i.name)}</b><small>Qty: ${i.quantity} · ₹${i.price}</small></div></div>`).join('')}</div></div></div><aside class="track-side"><div class="summary"><h3>Delivery Details</h3><p><b>${esc(o.customerName || state.user.name || 'Customer')}</b></p><p>${esc(o.customerPhone || '')}</p><p>${esc(o.shippingAddress || '')}</p><p>Pincode: ${esc(o.pincode || '')}</p><hr><p>Total <b style="float:right">₹${o.total}</b></p></div></aside></div><a class="btn" href="#/orders">Back to Orders</a></div></main>`

}

async function loginPage(admin = false) {

    if (admin) return `<main class="page"><div class="auth-shell"><div class="auth-panel"><div class="auth-copy"><span class="auth-kicker">FreshCart Admin</span><h1>Admin Login</h1><p>Manage products, categories, customers and orders from your admin portal.</p></div><form class="form auth-form" onsubmit="event.preventDefault();doLogin(true)"><label>Email<input id="email" type="email" required placeholder="you@example.com"></label><label>Password<input id="password" type="password" required placeholder="••••••••"></label><button class="btn">Login to Admin</button><div id="loginerr" class="error"></div></form></div></div></main>`;

    return `<main class="page auth-page"><div class="auth-shell"><div class="auth-visual"><div class="auth-visual-overlay"><span class="auth-kicker">Fresh groceries, simply delivered</span><h2>Welcome Back to<br>FreshCart</h2><p>Shop fresh vegetables and everyday essentials with FreshCart.</p><div class="auth-pills"><span>🥕 Farm fresh</span><span>🥬 Quality checked</span><span>🛒 Easy shopping</span></div></div></div><div class="auth-panel"><div class="auth-copy"><span class="auth-kicker">Welcome to FreshCart</span><h1>Welcome Back</h1><p>Login to continue shopping your everyday groceries.</p></div><form class="form auth-form" onsubmit="event.preventDefault();doLogin(false)"><label>Email<input id="email" type="email" required placeholder="you@example.com"></label><label>Password<input id="password" type="password" required placeholder="••••••••"></label><button class="btn auth-main-btn">Login</button><div id="loginerr" class="error"></div></form><p class="auth-switch">New customer? <a href="#/register">Create account</a></p></div></div></main>`

}

async function doLogin(admin) {

    try {

        let d = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: $('#email').value, password: $('#password').value }) });

        if (admin && d.user.role !== 'admin') throw Error('This account is not an admin account');

        state.token = d.token;

        state.user = d.user;

        save();

        toast('Login successful');

        location.hash = admin ? '#/admin' : '#/'

    } catch (e) {

        $('#loginerr').textContent = e.message

    }

}

function registerPage() {

    return `<main class="page auth-page"><div class="auth-shell"><div class="auth-visual"><div class="auth-visual-overlay"><span class="auth-kicker">FreshCart</span><h2>Welcome to<br>FreshCart</h2><p>Create your account and enjoy fresh groceries delivered to your door.</p><div class="auth-pills"><span>🥦 Fresh produce</span><span>🍎 Daily essentials</span><span>🚚 Easy delivery</span></div></div></div><div class="auth-panel"><div class="auth-copy"><span class="auth-kicker">Create your account</span><h1>Join FreshCart</h1><p>Sign up once and start shopping fresh groceries.</p></div><form class="form auth-form" onsubmit="event.preventDefault();doRegister()"><label>Full Name<input id="rname" required placeholder="Your full name"></label><label>Email<input id="remail" type="email" required placeholder="you@example.com"></label><label>Password<input id="rpass" type="password" minlength="6" required placeholder="Minimum 6 characters"></label><button class="btn auth-main-btn">Create Account</button><div id="regerr" class="error"></div></form><p class="auth-switch">Already have an account? <a href="#/login">Login</a></p></div></div></main>`

}

async function doRegister() {

    try {

        let d = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name: $('#rname').value, email: $('#remail').value, password: $('#rpass').value }) });

        state.token = d.token;

        state.user = d.user;

        save();

        location.hash = '#/';

        toast('Account created')

    } catch (e) {

        $('#regerr').textContent = e.message

    }

}

async function profilePage() {

    if (!state.user) return loginPage(false);

    let u = (await api('/auth/me')).user;

    return `<main class="page"><div class="container" style="max-width:700px"><h1>My Profile</h1><form class="form" onsubmit="event.preventDefault();saveProfile()"><label>Name<input id="pname" value="${esc(u.name)}"></label><label>Email<input value="${esc(u.email)}" disabled></label><label>Phone<input id="pphone" value="${esc(u.phone || '')}"></label><label>Address<textarea id="paddress">${esc(u.address || '')}</textarea></label><button class="btn">Save Profile</button></form><button class="btn alt" style="margin-top:12px" onclick="logout()">Logout</button></div></main>`

}

async function saveProfile() {

    let d = await api('/profile', { method: 'PUT', body: JSON.stringify({ name: $('#pname').value, phone: $('#pphone').value, address: $('#paddress').value }) });

    state.user = d.user;

    save();

    toast('Profile updated');

    render()

}

function logout() {

    state.user = null;

    state.token = '';

    save();

    toast('Logged out');

    location.hash = '#/'

}

function about() {

    return `<main class="page"><div class="container"><h1>About FreshCart</h1><p>FreshCart is a professional grocery store concept based on the project flows supplied for the Grocery Store: guest browsing, customer shopping and ordering, administration, reviews and delivery status.</p><div class="grid"><div class="cat"><h3>Fresh Products</h3><p>Organized grocery catalog with categories, product details, ratings and stock.</p></div><div class="cat"><h3>Customer Experience</h3><p>Login, profile, cart, checkout, orders, tracking and reviews.</p></div><div class="cat"><h3>Administration</h3><p>Manage users, products, categories, orders and reviews.</p></div></div></div></main>`

}

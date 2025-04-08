<script>
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';
  import { login, isAuthenticated } from './stores/auth';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  let email = '';
  let password = '';
  let ssoUsername = '';
  let ssoPassword = '';
  let rememberMe = false;
  let error = '';
  let isLoading = false;
  let loginMethod = 'email'; // 'email' or 'sso'
  
  // Time-related variables
  let currentTime = '';
  let currentDate = '';
  let currentStatus = '';
  let timeInterval;

  function handleAddButtonClick() {
    alert('You have to login first');
  }

  function updateTime() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const day = days[now.getDay()];
    const date = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();

    currentTime = `${hours}:${minutes} ${day}, ${date} ${month} ${year}`;
    
    // Simple logic for FREE/BUSY status (you can modify this based on your needs)
    const hour = now.getHours();
    currentStatus = (hour >= 9 && hour < 17) ? 'BUSY' : 'FREE';
  }

  // Redirect to home if already authenticated
  onMount(() => {
    if ($isAuthenticated) {
      navigate('/', { replace: true });
    }
    
    // Initialize time
    updateTime();
    
    // Update time every minute
    timeInterval = setInterval(updateTime, 60000);
    
    return () => {
      if (timeInterval) clearInterval(timeInterval);
    };
  });

  function handleLogin() {
    const username = loginMethod === 'email' ? email : ssoUsername;
    const pass = loginMethod === 'email' ? password : ssoPassword;

    if (!username || !pass) {
      error = 'Please fill in all fields';
      return;
    }

    isLoading = true;
    error = '';

    // Check for specific credentials
    setTimeout(() => {
      if (loginMethod === 'email') {
        if (email === 'info@mobile.tech.com' && password === 'admin') {
          login('dummy-token');
          navigate('/', { replace: true });
        } else {
          error = 'Invalid credentials';
        }
      } else if (loginMethod === 'sso') {
        if (ssoUsername === 'admin' && ssoPassword === 'admin') {
          login('dummy-token');
          navigate('/', { replace: true });
        } else {
          error = 'Invalid credentials';
        }
      }
      isLoading = false;
    }, 1000);
  }
</script>

<div class="page-container">
  <div class="sidebar">
    <div class="logo-c">
        <svg width="86" height="30" viewBox="0 0 86 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_755_3586)">
            <path d="M12.6288 4.22803V15.8516H10.6616V7.88968L7.00383 15.8516H5.64258L1.96722 7.89394V15.8559H0V4.22803H2.12091L6.33199 13.3438L10.5255 4.22803H12.6288Z" fill="white"/>
            <path d="M15.1538 8.74537C15.549 8.03007 16.0891 7.47656 16.7742 7.08059C17.4592 6.68463 18.2144 6.48877 19.0444 6.48877C19.7908 6.48877 20.4451 6.62927 21.0028 6.91454C21.5605 7.19981 22.004 7.5532 22.3377 7.97898V6.64205H24.3225V15.86H22.3377V14.4891C22.004 14.9233 21.5517 15.2853 20.9765 15.5748C20.4012 15.8643 19.7469 16.0091 19.0092 16.0091C18.1925 16.0091 17.446 15.8047 16.7654 15.4002C16.0847 14.9915 15.549 14.4252 15.1538 13.6929C14.7586 12.9648 14.5566 12.1345 14.5566 11.2106C14.5566 10.2867 14.7542 9.46493 15.1538 8.74963V8.74537ZM21.9337 9.57989C21.6615 9.11153 21.3102 8.75388 20.8711 8.51119C20.432 8.26425 19.9621 8.14503 19.4571 8.14503C18.9521 8.14503 18.4779 8.26424 18.0432 8.50268C17.6041 8.74111 17.2528 9.0945 16.9805 9.55434C16.7083 10.0184 16.5766 10.5677 16.5766 11.2021C16.5766 11.8365 16.7127 12.3942 16.9805 12.8754C17.2484 13.3565 17.6085 13.7184 18.052 13.9696C18.4955 14.2208 18.9653 14.3443 19.4571 14.3443C19.9489 14.3443 20.4363 14.2208 20.8711 13.9781C21.3102 13.7312 21.6615 13.3735 21.9337 12.9009C22.206 12.4283 22.3377 11.8705 22.3377 11.2361C22.3377 10.6017 22.2016 10.0482 21.9337 9.57989Z" fill="white"/>
            <path d="M30.6719 11.2532L35.0542 15.8516H32.3976L28.8803 11.8877V15.8516H26.9131V3.47437H28.8803V10.6657L32.3317 6.6336H35.0586L30.6763 11.249L30.6719 11.2532Z" fill="white"/>
            <path d="M38.7603 8.1919V13.2927C38.7603 13.6375 38.8437 13.8845 39.0106 14.0378C39.1774 14.1911 39.4629 14.2634 39.8668 14.2634H41.0744V15.8516H39.5199C38.6329 15.8516 37.9567 15.6515 37.4825 15.2512C37.0126 14.851 36.7755 14.1953 36.7755 13.2927V8.1919H35.6558V6.63783H36.7755V4.34717H38.7603V6.63783H41.07V8.1919H38.7603Z" fill="white"/>
            <path d="M42.8223 8.74537C43.2175 8.03007 43.7576 7.47656 44.4426 7.08059C45.1276 6.68463 45.8829 6.48877 46.7128 6.48877C47.4593 6.48877 48.1136 6.62927 48.6713 6.91454C49.2289 7.19981 49.6768 7.5532 50.0062 7.97898V6.64205H51.9909V15.86H50.0062V14.4891C49.6724 14.9233 49.2201 15.2853 48.6449 15.5748C48.0697 15.8643 47.4154 16.0091 46.6777 16.0091C45.8609 16.0091 45.1145 15.8047 44.4338 15.4002C43.7532 14.9915 43.2175 14.4252 42.8223 13.6929C42.4271 12.9648 42.2251 12.1345 42.2251 11.2106C42.2251 10.2867 42.4227 9.46493 42.8223 8.74963V8.74537ZM49.6022 9.57989C49.3299 9.11153 48.9786 8.75388 48.5395 8.51119C48.1004 8.26425 47.6306 8.14503 47.1256 8.14503C46.6206 8.14503 46.1464 8.26424 45.7116 8.50268C45.2769 8.74111 44.9212 9.0945 44.649 9.55434C44.3767 10.0184 44.245 10.5677 44.245 11.2021C44.245 11.8365 44.3811 12.3942 44.649 12.8754C44.9212 13.3565 45.2769 13.7184 45.7204 13.9696C46.1639 14.2208 46.6338 14.3443 47.1256 14.3443C47.6174 14.3443 48.1048 14.2208 48.5395 13.9781C48.9786 13.7312 49.3299 13.3735 49.6022 12.9009C49.87 12.4283 50.0062 11.8705 50.0062 11.2361C50.0062 10.6017 49.87 10.0482 49.6022 9.57989Z" fill="white"/>
            <path d="M57.9188 6.91462C58.4984 6.62935 59.1439 6.48884 59.8597 6.48884C60.6984 6.48884 61.458 6.6847 62.1386 7.07641C62.8149 7.46812 63.3506 8.02163 63.7414 8.74118C64.1322 9.46074 64.3298 10.2825 64.3298 11.2064C64.3298 12.1303 64.1322 12.9606 63.7414 13.6887C63.3506 14.421 62.8105 14.9873 62.1299 15.396C61.4449 15.8048 60.6896 16.0049 59.8597 16.0049C59.122 16.0049 58.4721 15.8644 57.9012 15.5876C57.3304 15.3109 56.8781 14.9532 56.5488 14.5189V15.8559H54.5815V3.47437H56.5488V8.00885C56.8825 7.56179 57.3392 7.19563 57.9188 6.91462ZM61.9191 9.55441C61.6468 9.09032 61.2912 8.74118 60.8477 8.50275C60.4042 8.26432 59.9299 8.1451 59.4249 8.1451C58.92 8.1451 58.4633 8.26858 58.0198 8.51127C57.5763 8.75821 57.2206 9.11161 56.9484 9.57996C56.6761 10.0483 56.5444 10.6018 56.5444 11.2362C56.5444 11.8706 56.6805 12.4284 56.9484 12.901C57.2162 13.3736 57.5763 13.7355 58.0198 13.9782C58.4633 14.2251 58.9331 14.3444 59.4249 14.3444C59.9167 14.3444 60.4042 14.2209 60.8477 13.9697C61.2912 13.7185 61.6468 13.3523 61.9191 12.8754C62.1913 12.3986 62.3231 11.8366 62.3231 11.2022C62.3231 10.5678 62.187 10.0185 61.9191 9.55441Z" fill="white"/>
            <path d="M66.3806 5.06676C66.1391 4.83258 66.0205 4.54306 66.0205 4.19818C66.0205 3.8533 66.1391 3.56378 66.3806 3.3296C66.6221 3.09543 66.9207 2.98047 67.2764 2.98047C67.632 2.98047 67.9131 3.09543 68.1546 3.3296C68.3961 3.56378 68.519 3.8533 68.519 4.19818C68.519 4.54306 68.3961 4.83258 68.1546 5.06676C67.9131 5.30093 67.6189 5.42015 67.2764 5.42015C66.9339 5.42015 66.6221 5.30093 66.3806 5.06676ZM68.2424 6.63786V15.8559H66.2752V6.63786H68.2424Z" fill="white"/>
            <path d="M46.1023 19.4919V20.599H43.8277V27.7775H42.4269V20.599H40.1392V19.4919H46.1023Z" fill="white"/>
            <path d="M53.6726 24.9973H48.4955C48.535 25.521 48.737 25.9425 49.097 26.2618C49.4571 26.5811 49.9006 26.7387 50.4232 26.7387C51.1784 26.7387 51.7098 26.4321 52.0215 25.819H53.5321C53.3257 26.4236 52.9568 26.9175 52.4211 27.3049C51.8854 27.6924 51.2179 27.884 50.4232 27.884C49.7733 27.884 49.1936 27.7435 48.6843 27.4625C48.1705 27.1815 47.7709 26.7812 47.4811 26.2703C47.1913 25.7594 47.0464 25.1633 47.0464 24.4863C47.0464 23.8093 47.1869 23.2175 47.4723 22.7023C47.7534 22.1914 48.1529 21.7954 48.6667 21.5144C49.1805 21.2334 49.7689 21.0972 50.4319 21.0972C51.095 21.0972 51.6395 21.2334 52.1401 21.5017C52.6407 21.7699 53.0315 22.1531 53.3081 22.6385C53.5848 23.1281 53.7253 23.6901 53.7253 24.3245C53.7253 24.5715 53.7077 24.7929 53.677 24.993L53.6726 24.9973ZM52.2586 23.8988C52.2499 23.3963 52.0654 22.9961 51.7054 22.6938C51.3453 22.3915 50.8974 22.2425 50.3661 22.2425C49.883 22.2425 49.4703 22.3915 49.1234 22.6896C48.7809 22.9876 48.5745 23.3921 48.5086 23.8988H52.2586Z" fill="white"/>
            <path d="M55.0558 22.7023C55.3369 22.1914 55.7321 21.7954 56.2283 21.5144C56.7245 21.2334 57.3041 21.0972 57.9496 21.0972C58.7707 21.0972 59.4469 21.2845 59.9827 21.6634C60.5184 22.0424 60.8828 22.5789 61.0717 23.2771H59.5611C59.4382 22.9535 59.2406 22.6981 58.9727 22.515C58.7005 22.3319 58.3623 22.2425 57.954 22.2425C57.3787 22.2425 56.922 22.4384 56.5839 22.8343C56.2458 23.2303 56.0746 23.7795 56.0746 24.4863C56.0746 25.1931 56.2458 25.7466 56.5839 26.1426C56.922 26.5386 57.3831 26.7387 57.954 26.7387C58.7663 26.7387 59.302 26.3938 59.5655 25.6998H61.076C60.8784 26.3682 60.5096 26.8962 59.9695 27.2922C59.4294 27.6839 58.7575 27.884 57.954 27.884C57.3085 27.884 56.7332 27.7435 56.2326 27.4625C55.7321 27.1815 55.3412 26.7812 55.0602 26.2703C54.7792 25.7594 54.6343 25.1633 54.6343 24.4863C54.6343 23.8093 54.7748 23.2175 55.0602 22.7023H55.0558Z" fill="white"/>
            <path d="M67.3639 21.4207C67.7679 21.6335 68.0884 21.9529 68.3211 22.3744C68.5539 22.7959 68.6724 23.3026 68.6724 23.8987V27.7732H67.2848V24.103C67.2848 23.5155 67.1311 23.0641 66.8282 22.7491C66.5252 22.434 66.1124 22.2765 65.5855 22.2765C65.0585 22.2765 64.6458 22.434 64.3384 22.7491C64.031 23.0641 63.8773 23.5155 63.8773 24.103V27.7732H62.4766V18.9512H63.8773V21.9656C64.1144 21.6889 64.4174 21.4718 64.7819 21.3227C65.1464 21.1737 65.546 21.0971 65.9807 21.0971C66.4988 21.0971 66.9599 21.2035 67.3639 21.4207Z" fill="white"/>
            <path d="M78.5123 13.7273L72.2988 19.752V30.3191L85.6549 15.9574L78.5123 13.7273Z" fill="url(#paint0_linear_755_3586)"/>
            <path d="M85.3361 12.4198L72.2988 0V9.61397L77.9502 15.0937L78.0951 15.2427C78.161 15.3108 78.2444 15.3917 78.341 15.4854C78.7625 15.8856 79.3993 16.4859 79.6188 17.3418C79.9877 18.7936 79.6847 20.7607 79.6847 20.7777L79.3817 22.7022L85.2834 16.9756C86.5656 15.7281 86.5875 13.6886 85.3361 12.4156V12.4198Z" fill="white"/>
            </g>
            <defs>
            <linearGradient id="paint0_linear_755_3586" x1="84.0261" y1="13.4042" x2="72.5325" y2="24.81" gradientUnits="userSpaceOnUse">
            <stop stop-color="#A5D48F"/>
            <stop offset="1" stop-color="white"/>
            </linearGradient>
            <clipPath id="clip0_755_3586">
            <rect width="86" height="30" fill="white"/>
            </clipPath>
            </defs>
            </svg>
            
    </div>
    <div class="sign-in-form">
      <h2>Sign In</h2>
      
      <div class="login-method-switch">
        <button 
          class="switch-button {loginMethod === 'email' ? 'active' : ''}"
          on:click={() => loginMethod = 'email'}
        >
          Email
        </button>
        <button 
          class="switch-button {loginMethod === 'sso' ? 'active' : ''}"
          on:click={() => loginMethod = 'sso'}
        >
          SSO
        </button>
      </div>

      {#if error}
        <div class="error-message">{error}</div>
      {/if}

      <form on:submit|preventDefault={handleLogin}>
        {#if loginMethod === 'email'}
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              bind:value={email}
              placeholder="Enter email address"
              required
              disabled={isLoading}
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-input">
              <input
                type="password"
                id="password"
                bind:value={password}
                placeholder="Enter password"
                required
                disabled={isLoading}
              />
            </div>
          </div>
        {:else}
          <div class="form-group">
            <label for="ssoUsername">Username</label>
            <input
              type="text"
              id="ssoUsername"
              bind:value={ssoUsername}
              placeholder="Enter username"
              required
              disabled={isLoading}
            />
          </div>

          <div class="form-group">
            <label for="ssoPassword">Password</label>
            <div class="password-input">
              <input
                type="password"
                id="ssoPassword"
                bind:value={ssoPassword}
                placeholder="Enter password"
                required
                disabled={isLoading}
              />
            </div>
          </div>
        {/if}

        <button type="submit" class="sign-in-button" disabled={isLoading}>
          {#if isLoading}
            {loginMethod === 'sso' ? 'Redirecting...' : 'Signing in...'}
          {:else}
            Sign In →
          {/if}
        </button>
      </form>
    </div>
  </div>
  <div class="main-content">
    <div class="content-left">
      <div class="header">
        <div class="time-section">
          <div class="time">{currentTime}</div>
          <div class="status">{currentStatus}</div>
        </div>
      </div>

      <div class="next-meeting-section">
        <div class="next-meeting-text">Next meeting after</div>
        <div class="timer">1:59:34</div>
      </div>
    </div>

    <div class="add-button-container">
      <button class="add-button" on:click={handleAddButtonClick}>
        <svg class="plus" width="76" height="76" viewBox="0 0 76 76" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M38.0002 15.8333V60.1666M15.8335 37.9999H60.1668" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            
      </button>
    </div>

    <div class="content-right">
      <div class="meetings-header">
        <div class="view-more">
          View More →
        </div>
      </div>
      <div class="meetings-section">
        <div class="today-label">Today</div>
        <div class="meetings-list">
          <div class="meeting-item">
              <div class="meeting-organizer">Organizer Name</div>
              <div class="meeting-title">Board Meeting</div>
            <div class="meeting-time">15:45 → 16:15</div>
          </div>
          <div class="meeting-item">
              <div class="meeting-organizer">Organizer Name</div>
              <div class="meeting-title">Interview With John Doe</div>
            <div class="meeting-time">16:45 → 16:15</div>
          </div>
          <div class="meeting-item">
              <div class="meeting-organizer">Organizer Name</div>
              <div class="meeting-title">Customer Demo</div>
            <div class="meeting-time">16:45 → 16:15</div>
          </div>
        </div>

        <div class="tomorrow-label">Tomorrow, Friday, 21 Feb</div>
        <div class="meetings-list">
          <div class="meeting-item">
              <div class="meeting-organizer">Organizer Name</div>
              <div class="meeting-title">Customer Demo</div>
            <div class="meeting-time">15:45 → 16:15</div>
          </div>
          <div class="meeting-item">
              <div class="meeting-organizer">Organizer Name</div>
              <div class="meeting-title">Board Meeting</div>
            <div class="meeting-time">15:45 → 16:15</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .page-container {
    display: flex;
    min-height: 100vh;
    background-color: #E4E4E4;
    /* border-radius: 24px; */
  }

  .sidebar {
    width: 450px;
    background-color: #000000;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    border-radius: 24px;
    margin-left: 1px;
    
  }

  .logo-c {
    margin-bottom: 3rem;
    padding-left: 0.5rem;
  }

  .logo {
    height: 30px;
    width: 86px;
  }

  .sign-in-form {
  margin-left: calc((100% - 356px - 16px) / 2);
    margin-top: 36px;
    color: white;
    padding: 0 0.5rem;
  }

  h2 {
    font-size: 16px;
    margin-bottom: 1.25rem;
    line-height: 47px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.95);
  }

  .login-method-switch {
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
  }

  .switch-button {
    width: 64px;
    height: 32px;
    padding: 8px 16px;
    border: none;
    background: white;
    color: black;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
    font-weight: 500;
    font-size: 14px;
    margin-right: 8px;
  }

  .switch-button.active {
    background: #3CE155;
    color: #000000;
  }


  .form-group {
    margin-bottom: 1.25rem;
    width: 356px;
  }

  label {
    display: block;
    line-height: 20px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
    font-weight: 400;
   
  }

  input[type="email"],
  input[type="password"] {
    width: 100%;
    height: 24px;
    background-color: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    text-align: left;
    padding: 8px;
    margin-top: 8px;
  }

  input[type="email"]::placeholder,
  input[type="password"]::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  input[type="email"]:focus,
  input[type="password"]:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.1);
  }
  .sign-in-button {
    width: 374px;
    padding:8px;
    background-color: #3CE155;
    color: #ffff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 42px;
  }

  .sign-in-button:hover {
    background-color: #2eff4d;
  }

  .sign-in-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .error-message {
    color: #ff4444;
    background-color: rgba(255, 68, 68, 0.1);
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    text-align: center;
    font-size: 0.875rem;
  }

  .main-content {
    flex: 1;
    padding: 32px;
    color: white;
    background-color: #E4E4E4;
    position: relative;
    display: flex;
    gap: 48px;
  }

  .content-left {
    flex: 1;
    max-width: 600px;
  }

  .content-right {
    width: 360px;
    padding-right: 16px;
  }

  .meetings-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 48px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 48px;
  }

  .time-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .time {
    font-size: 20px;
    color: #7C7C7C;
  }

  .status {
    font-size: 42px;
    font-weight: 600;
    color: black;
    line-height: 1;
  }

  .view-more {
    color: #7C7C7C;
    font-size: 16px;
    cursor: pointer;
  }

  .next-meeting-section {
    margin-bottom: 48px;
    position: relative;
  }

  .next-meeting-text {
    font-size: 24px;
    color: #000000;
    margin-bottom: 8px;
  }

  .timer {
    font-size: 24px;
    font-weight: 500;
    color: #000000;
  }

  .add-button-container {
    position: relative;
    width: 50px;
    display: flex;
    align-items: center;
    justify-content: left;
  }

  .add-button {
    position: absolute;
    width: 112px;
    height: 112px;
    border-radius: 50%;
    background-color: #000;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
    margin-left: -320px;
    cursor: pointer;
  }

  .plus {
    color: white;
    font-size: 48px;
    line-height: 1;
    font-family: sans-serif;
  }

  .meetings-section {
    margin-top: 0;
    max-height: calc(100vh - 140px);
    overflow-y: auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* Internet Explorer 10+ */
  }

  .meetings-section::-webkit-scrollbar {
    display: none; /* WebKit */
  }

  .today-label, .tomorrow-label {
    color: #7C7C7C;
    font-size: 14px;
    margin-bottom: 16px;
    margin-left: 8px;
  }

  .tomorrow-label {
    margin-top: 24px;
  }

  .meetings-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .meeting-item {
    background-color: rgb(255, 255, 255);
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .meeting-time {
    font-size: 14px;
    color: #7C7C7C;
    margin-bottom: 4px;
  }

  .meeting-title {
    font-size: 16px;
    font-weight: 500;
    color: black;
    margin-bottom: 4px;
  }

  .meeting-organizer {
    font-size: 14px;
    color: #7C7C7C;
  }

  /* Add specific styles for SSO inputs */
  input[type="text"] {
    width: 100%;
    height: 24px;
    background-color: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    text-align: left;
    padding: 8px;
    margin-top: 8px;
  }

  input[type="text"]::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  input[type="text"]:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.1);
  }
</style>

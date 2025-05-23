<script>
    import { createEventDispatcher, onMount } from "svelte";
    import homeIcon from "./icons/home.svg";
    import displayIcon from "./icons/display.svg";
    import cameraIcon from "./icons/camera.svg";
    import presentsIcon from "./icons/presents.svg";
    import lightingIcon from "./icons/lighting.svg";
    import commandIcon from "./icons/command.svg";
    import imersiveIcon from "./icons/imersive.svg";
    import orderIcon from "./icons/order.svg";
    const dispatch = createEventDispatcher();

    let socket;
    let activeMenuItem = "imersive";
    const menuItems = [
        { id: "home", icon: homeIcon, label: "Home" },
        { id: "display", icon: displayIcon, label: "Display" },
        { id: "presents", icon: presentsIcon, label: "Presents" },
        { id: "camera", icon: cameraIcon, label: "Camera" },
        { id: "lighting", icon: lightingIcon, label: "Lighting" },
        { id: "command", icon: commandIcon, label: "Command" },
        { id: "imersive", icon: imersiveIcon, label: "Imersive" },
        { id: "order", icon: orderIcon, label: "Order" },
    ];

    // Control states
    let controls = {
        lights: { id: "lights", name: "Lights", on: true },
        audioInput: { id: "audioInput", name: "Audio Input", on: false },
        audioOutput: { id: "audioOutput", name: "Audio Output", on: true },
    };

    // Projector states
    let projectorStatus = {
        fan: { status: "ok", label: "Ok" },
        cover: { status: "fault", label: "Fault" },
        lamp: { status: "ok", label: "Ok" },
        filter: { status: "ok", label: "Ok" },
        temperature: { status: "warn", label: "Warm" },
        other: { status: "ok", label: "Ok" },
    };

    onMount(() => {
        // Initialize WebSocket connection
        socket = new WebSocket('ws://localhost:3000'); // Adjust the URL to your WebSocket server

        socket.onopen = () => {
            console.log('WebSocket connection established');
            // Send initial states of all controls
            Object.values(controls).forEach(control => {
                sendControlState(control);
            });
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onclose = () => {
            console.log('WebSocket connection closed');
        };
    });

    function sendControlState(control) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            const data = {
                id: control.id,
                name: control.name,
                status: control.on ? "on" : "off"
            };
            socket.send(JSON.stringify(data));
            console.log('Data sent successfully:', data);
        } else {
            console.log('WebSocket not ready. Current state:', socket ? socket.readyState : 'No socket');
        }
    }

    function toggleControl(control) {
        controls[control].on = !controls[control].on;
        dispatch("controlToggle", {
            control,
            state: controls[control].on,
        });
        // Send the updated state to the server
        sendControlState(controls[control]);
    }

    function handleMenuClick(itemId) {
        activeMenuItem = itemId;
        dispatch("menuSelect", { id: itemId });
    }
</script>

<div class="sidebar-wrapper">
    <!-- Left Menu Strip -->
    <div class="layout">
        <div class="icon-menu">
            <div class="logo">
                <svg
                    width="42"
                    height="16"
                    viewBox="0 0 42 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M7.63605 1.53687V8.51103H6.44657V3.73386L4.23487 8.51103H3.4118L1.18948 3.73641V8.51359H0V1.53687H1.28241L3.82864 7.00635L6.36426 1.53687H7.63605Z"
                        fill="white"
                    />
                    <path
                        d="M9.16285 4.24727C9.40181 3.81809 9.72839 3.48599 10.1426 3.24841C10.5568 3.01082 11.0134 2.89331 11.5153 2.89331C11.9666 2.89331 12.3622 2.97761 12.6994 3.14877C13.0366 3.31994 13.3048 3.53197 13.5066 3.78743V2.98528H14.7067V8.51608H13.5066V7.69348C13.3048 7.95405 13.0313 8.1712 12.6835 8.34491C12.3357 8.51863 11.9401 8.60549 11.494 8.60549C11.0002 8.60549 10.5488 8.48286 10.1373 8.24017C9.72573 7.99493 9.40181 7.65516 9.16285 7.21576C8.92389 6.77892 8.80176 6.28076 8.80176 5.72641C8.80176 5.17205 8.92124 4.679 9.16285 4.24982V4.24727ZM13.2623 4.74798C13.0977 4.46697 12.8853 4.25238 12.6198 4.10677C12.3543 3.9586 12.0702 3.88707 11.7648 3.88707C11.4595 3.88707 11.1728 3.9586 10.9099 4.10166C10.6444 4.24472 10.432 4.45675 10.2674 4.73265C10.1028 5.01111 10.0231 5.34066 10.0231 5.7213C10.0231 6.10194 10.1054 6.4366 10.2674 6.72527C10.4293 7.01395 10.647 7.23109 10.9152 7.38182C11.1834 7.53254 11.4675 7.60662 11.7648 7.60662C12.0622 7.60662 12.3569 7.53254 12.6198 7.38692C12.8853 7.23876 13.0977 7.02417 13.2623 6.7406C13.4269 6.45703 13.5066 6.12238 13.5066 5.74174C13.5066 5.36109 13.4243 5.02899 13.2623 4.74798Z"
                        fill="white"
                    />
                    <path
                        d="M18.5462 5.75205L21.196 8.51106H19.5896L17.4629 6.13269V8.51106H16.2734V1.08472H17.4629V5.39951L19.5498 2.98026H21.1986L18.5489 5.74949L18.5462 5.75205Z"
                        fill="white"
                    />
                    <path
                        d="M23.4367 3.91524V6.9757C23.4367 7.18262 23.4872 7.33079 23.5881 7.42276C23.689 7.51473 23.8615 7.55816 24.1058 7.55816H24.836V8.51104H23.8961C23.3597 8.51104 22.9508 8.39097 22.6641 8.15083C22.38 7.9107 22.2366 7.51728 22.2366 6.9757V3.91524H21.5596V2.9828H22.2366V1.6084H23.4367V2.9828H24.8333V3.91524H23.4367Z"
                        fill="white"
                    />
                    <path
                        d="M25.8923 4.24727C26.1313 3.81809 26.4579 3.48599 26.8721 3.24841C27.2863 3.01082 27.7429 2.89331 28.2448 2.89331C28.6961 2.89331 29.0917 2.97761 29.4289 3.14877C29.7661 3.31994 30.0369 3.53197 30.2361 3.78743V2.98528H31.4362V8.51608H30.2361V7.69348C30.0343 7.95405 29.7608 8.1712 29.413 8.34491C29.0652 8.51863 28.6696 8.60549 28.2235 8.60549C27.7297 8.60549 27.2783 8.48286 26.8668 8.24017C26.4552 7.99493 26.1313 7.65516 25.8923 7.21576C25.6534 6.77892 25.5312 6.28076 25.5312 5.72641C25.5312 5.17205 25.6507 4.679 25.8923 4.24982V4.24727ZM29.9918 4.74798C29.8272 4.46697 29.6148 4.25238 29.3493 4.10677C29.0838 3.9586 28.7997 3.88707 28.4943 3.88707C28.189 3.88707 27.9022 3.9586 27.6394 4.10166C27.3765 4.24472 27.1615 4.45675 26.9969 4.73265C26.8322 5.01111 26.7526 5.34066 26.7526 5.7213C26.7526 6.10194 26.8349 6.4366 26.9969 6.72527C27.1615 7.01395 27.3765 7.23109 27.6447 7.38182C27.9129 7.53254 28.197 7.60662 28.4943 7.60662C28.7917 7.60662 29.0864 7.53254 29.3493 7.38692C29.6148 7.23876 29.8272 7.02417 29.9918 6.7406C30.1538 6.45703 30.2361 6.12238 30.2361 5.74174C30.2361 5.36109 30.1538 5.02899 29.9918 4.74798Z"
                        fill="white"
                    />
                    <path
                        d="M35.0208 3.14887C35.3713 2.97771 35.7616 2.8934 36.1944 2.8934C36.7015 2.8934 37.1608 3.01092 37.5723 3.24594C37.9812 3.48097 38.3052 3.81307 38.5415 4.24481C38.7778 4.67654 38.8972 5.16959 38.8972 5.72395C38.8972 6.2783 38.7778 6.77646 38.5415 7.2133C38.3052 7.6527 37.9786 7.99247 37.567 8.23771C37.1528 8.48296 36.6962 8.60303 36.1944 8.60303C35.7483 8.60303 35.3553 8.51872 35.0102 8.35267C34.665 8.18662 34.3915 7.97203 34.1924 7.71146V8.51361H33.0029V1.08472H34.1924V3.80541C34.3942 3.53717 34.6703 3.31747 35.0208 3.14887ZM37.4396 4.73274C37.275 4.45429 37.0599 4.24481 36.7917 4.10175C36.5236 3.95869 36.2368 3.88716 35.9315 3.88716C35.6262 3.88716 35.35 3.96124 35.0819 4.10686C34.8137 4.25503 34.5986 4.46706 34.434 4.74807C34.2694 5.02908 34.1898 5.36119 34.1898 5.74183C34.1898 6.12247 34.2721 6.45713 34.434 6.74069C34.596 7.02426 34.8137 7.2414 35.0819 7.38702C35.35 7.53519 35.6341 7.60672 35.9315 7.60672C36.2289 7.60672 36.5236 7.53263 36.7917 7.38191C37.0599 7.23118 37.275 7.01148 37.4396 6.72536C37.6042 6.43924 37.6839 6.10203 37.6839 5.72139C37.6839 5.34075 37.6015 5.0112 37.4396 4.73274Z"
                        fill="white"
                    />
                    <path
                        d="M40.1367 2.0401C39.9906 1.8996 39.9189 1.72588 39.9189 1.51896C39.9189 1.31203 39.9906 1.13832 40.1367 0.997811C40.2827 0.857305 40.4632 0.78833 40.6783 0.78833C40.8934 0.78833 41.0633 0.857305 41.2093 0.997811C41.3554 1.13832 41.4297 1.31203 41.4297 1.51896C41.4297 1.72588 41.3554 1.8996 41.2093 2.0401C41.0633 2.18061 40.8854 2.25214 40.6783 2.25214C40.4712 2.25214 40.2827 2.18061 40.1367 2.0401ZM41.2624 2.98277V8.51357H40.0729V2.98277H41.2624Z"
                        fill="white"
                    />
                    <path
                        d="M27.8761 10.6953V11.3595H26.5008V15.6666H25.6538V11.3595H24.2705V10.6953H27.8761Z"
                        fill="white"
                    />
                    <path
                        d="M32.4528 13.9985H29.3225C29.3464 14.3127 29.4685 14.5656 29.6862 14.7572C29.9039 14.9488 30.1721 15.0433 30.4881 15.0433C30.9447 15.0433 31.266 14.8594 31.4545 14.4915H32.3679C32.2431 14.8543 32.02 15.1506 31.6961 15.3831C31.3722 15.6156 30.9686 15.7305 30.4881 15.7305C30.0951 15.7305 29.7446 15.6462 29.4366 15.4776C29.126 15.309 28.8844 15.0689 28.7091 14.7623C28.5339 14.4558 28.4463 14.0981 28.4463 13.6919C28.4463 13.2858 28.5313 12.9307 28.7038 12.6215C28.8738 12.315 29.1154 12.0774 29.426 11.9088C29.7367 11.7402 30.0924 11.6584 30.4934 11.6584C30.8943 11.6584 31.2235 11.7402 31.5262 11.9011C31.8289 12.0621 32.0652 12.292 32.2325 12.5832C32.3997 12.877 32.4847 13.2142 32.4847 13.5949C32.4847 13.743 32.4741 13.8759 32.4555 13.9959L32.4528 13.9985ZM31.5979 13.3394C31.5926 13.038 31.4811 12.7978 31.2633 12.6164C31.0456 12.4351 30.7748 12.3456 30.4535 12.3456C30.1615 12.3456 29.9119 12.4351 29.7021 12.6139C29.4951 12.7927 29.3703 13.0354 29.3304 13.3394H31.5979Z"
                        fill="white"
                    />
                    <path
                        d="M33.29 12.6215C33.46 12.315 33.6989 12.0774 33.999 11.9088C34.299 11.7402 34.6495 11.6584 35.0398 11.6584C35.5363 11.6584 35.9451 11.7709 36.2691 11.9982C36.593 12.2256 36.8134 12.5475 36.9275 12.9664H36.0142C35.9398 12.7723 35.8204 12.619 35.6584 12.5091C35.4938 12.3993 35.2893 12.3456 35.0424 12.3456C34.6946 12.3456 34.4185 12.4632 34.214 12.7007C34.0096 12.9383 33.906 13.2679 33.906 13.6919C33.906 14.116 34.0096 14.4481 34.214 14.6857C34.4185 14.9233 34.6972 15.0433 35.0424 15.0433C35.5336 15.0433 35.8575 14.8364 36.0168 14.42H36.9302C36.8107 14.8211 36.5877 15.1379 36.2611 15.3755C35.9345 15.6105 35.5283 15.7305 35.0424 15.7305C34.6521 15.7305 34.3043 15.6462 34.0016 15.4776C33.6989 15.309 33.4626 15.0689 33.2927 14.7623C33.1228 14.4558 33.0352 14.0981 33.0352 13.6919C33.0352 13.2858 33.1201 12.9307 33.2927 12.6215H33.29Z"
                        fill="white"
                    />
                    <path
                        d="M40.7315 11.8525C40.9758 11.9803 41.1696 12.1719 41.3103 12.4248C41.451 12.6777 41.5227 12.9817 41.5227 13.3393V15.6641H40.6837V13.462C40.6837 13.1094 40.5908 12.8386 40.4076 12.6496C40.2244 12.4605 39.9748 12.366 39.6562 12.366C39.3376 12.366 39.088 12.4605 38.9021 12.6496C38.7163 12.8386 38.6233 13.1094 38.6233 13.462V15.6641H37.7764V10.3708H38.6233V12.1795C38.7667 12.0135 38.9499 11.8832 39.1703 11.7938C39.3907 11.7044 39.6323 11.6584 39.8951 11.6584C40.2084 11.6584 40.4872 11.7223 40.7315 11.8525Z"
                        fill="white"
                    />
                </svg>
            </div>
            <nav class="menu-items">
                {#each menuItems as item}
                    <button
                        class="menu-item"
                        class:active={activeMenuItem === item.id}
                        on:click={() => handleMenuClick(item.id)}
                    >
                            <img
                                src={item.icon}
                                alt={item.label}
                                class="menu-icon"
                            />
                    </button>
                {/each}
            </nav>
            <div class="bottom-icons">
                <button class="menu-item settings">
                    <span class="icon"
                        ><svg
                            width="22"
                            height="20"
                            viewBox="0 0 22 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M2.75 7.59163V12.4C2.75 14.1666 2.75 14.1666 4.58333 15.2916L9.625 17.9416C10.3858 18.3416 11.6233 18.3416 12.375 17.9416L17.4167 15.2916C19.25 14.1666 19.25 14.1666 19.25 12.4083V7.59163C19.25 5.8333 19.25 5.8333 17.4167 4.7083L12.375 2.0583C11.6233 1.6583 10.3858 1.6583 9.625 2.0583L4.58333 4.7083C2.75 5.8333 2.75 5.8333 2.75 7.59163Z"
                                stroke="#BFBFBF"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                style="mix-blend-mode:plus-darker"
                            />
                            <path
                                d="M11 12.5C12.5188 12.5 13.75 11.3807 13.75 10C13.75 8.61929 12.5188 7.5 11 7.5C9.48122 7.5 8.25 8.61929 8.25 10C8.25 11.3807 9.48122 12.5 11 12.5Z"
                                stroke="#BFBFBF"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                style="mix-blend-mode:plus-darker"
                            />
                        </svg>
                    </span>
                </button>
                <button class="menu-item exit">
                    <span class="icon"
                        ><svg
                            width="22"
                            height="20"
                            viewBox="0 0 22 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M13.9698 18.5583H13.8506C9.78064 18.5583 7.81898 17.1 7.47981 13.8333C7.44314 13.4917 7.71814 13.1833 8.10314 13.15C8.47898 13.1166 8.81814 13.375 8.85481 13.7167C9.12064 16.3333 10.4773 17.3083 13.8598 17.3083H13.979C17.7098 17.3083 19.0298 16.1083 19.0298 12.7167V7.28332C19.0298 3.89165 17.7098 2.69165 13.979 2.69165H13.8598C10.459 2.69165 9.10231 3.68332 8.85481 6.34998C8.80898 6.69165 8.49731 6.94998 8.10314 6.91665C7.71814 6.89165 7.44314 6.58332 7.47064 6.24165C7.78231 2.92498 9.75314 1.44165 13.8506 1.44165H13.9698C18.4706 1.44165 20.3956 3.19165 20.3956 7.28332V12.7167C20.3956 16.8083 18.4706 18.5583 13.9698 18.5583Z"
                                fill="#FF453A"
                            />
                            <path
                                d="M13.6397 10.625H1.83301C1.45717 10.625 1.14551 10.3417 1.14551 10C1.14551 9.65833 1.45717 9.375 1.83301 9.375H13.6397C14.0155 9.375 14.3272 9.65833 14.3272 10C14.3272 10.3417 14.0247 10.625 13.6397 10.625Z"
                                fill="#FF453A"
                            />
                            <path
                                d="M11.5954 13.4167C11.4212 13.4167 11.247 13.3584 11.1095 13.2334C10.8437 12.9917 10.8437 12.5917 11.1095 12.35L13.6945 10L11.1095 7.65003C10.8437 7.40837 10.8437 7.00837 11.1095 6.7667C11.3754 6.52503 11.8154 6.52503 12.0812 6.7667L15.152 9.55837C15.4179 9.80003 15.4179 10.2 15.152 10.4417L12.0812 13.2334C11.9437 13.3584 11.7695 13.4167 11.5954 13.4167Z"
                                fill="#FF453A"
                            />
                        </svg>
                    </span>
                </button>
            </div>
        </div>

        <!-- Main Controls Panel -->
        <div class="controls-panel">
            <div class="header">
                <div class="back-button">Immersive Room</div>
            </div>

            <div class="controls">
                <!-- Lights -->
                <div class="control-card">
                    <div class="control-row">
                        <div class="control-icon">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M13.7501 18.125C13.7501 18.2908 13.6843 18.4498 13.567 18.567C13.4498 18.6842 13.2909 18.75 13.1251 18.75H6.8751C6.70934 18.75 6.55037 18.6842 6.43316 18.567C6.31595 18.4498 6.2501 18.2908 6.2501 18.125C6.2501 17.9593 6.31595 17.8003 6.43316 17.6831C6.55037 17.5659 6.70934 17.5 6.8751 17.5H13.1251C13.2909 17.5 13.4498 17.5659 13.567 17.6831C13.6843 17.8003 13.7501 17.9593 13.7501 18.125ZM16.8751 8.12504C16.8778 9.16695 16.6424 10.1957 16.1869 11.1328C15.7315 12.0699 15.0679 12.8905 14.247 13.5321C14.0935 13.6497 13.9689 13.8009 13.8828 13.9741C13.7967 14.1473 13.7513 14.3379 13.7501 14.5313V15C13.7501 15.3316 13.6184 15.6495 13.384 15.8839C13.1496 16.1183 12.8316 16.25 12.5001 16.25H7.5001C7.16858 16.25 6.85064 16.1183 6.61622 15.8839C6.3818 15.6495 6.2501 15.3316 6.2501 15V14.5313C6.24997 14.3402 6.20603 14.1517 6.12166 13.9802C6.03728 13.8088 5.91472 13.6589 5.76338 13.5422C4.94448 12.9045 4.28139 12.0887 3.8243 11.1568C3.36722 10.2249 3.12812 9.20128 3.1251 8.16332C3.10479 4.43989 6.11416 1.3391 9.83448 1.25004C10.7512 1.22795 11.663 1.38946 12.5163 1.72506C13.3696 2.06065 14.1472 2.56356 14.8033 3.20418C15.4593 3.84479 15.9806 4.61017 16.3364 5.45527C16.6922 6.30036 16.8754 7.2081 16.8751 8.12504ZM15.6251 8.12504C15.6253 7.37478 15.4754 6.63205 15.1843 5.94058C14.8932 5.24911 14.4666 4.62287 13.9298 4.09872C13.393 3.57458 12.7568 3.16312 12.0585 2.88856C11.3603 2.61401 10.6142 2.48191 9.86417 2.50004C6.81729 2.57192 4.3587 5.10864 4.3751 8.15551C4.37796 9.00441 4.57385 9.84153 4.94796 10.6036C5.32206 11.3656 5.86459 12.0325 6.53448 12.5539C6.8356 12.788 7.07918 13.0879 7.24655 13.4307C7.41392 13.7734 7.50065 14.1499 7.5001 14.5313V15H12.5001V14.5313C12.501 14.1488 12.5892 13.7715 12.758 13.4283C12.9269 13.0851 13.1719 12.785 13.4743 12.5508C14.1463 12.0257 14.6894 11.354 15.0621 10.5869C15.4349 9.81991 15.6274 8.97785 15.6251 8.12504ZM14.3665 7.39536C14.2044 6.49012 13.7689 5.65626 13.1186 5.00606C12.4682 4.35585 11.6343 3.92051 10.729 3.75864C10.6481 3.74499 10.5652 3.74742 10.4852 3.76579C10.4052 3.78416 10.3296 3.81811 10.2627 3.8657C10.1958 3.91329 10.139 3.97359 10.0954 4.04316C10.0518 4.11272 10.0223 4.19019 10.0087 4.27114C9.99505 4.35208 9.99748 4.43493 10.0159 4.51493C10.0342 4.59494 10.0682 4.67055 10.1158 4.73743C10.1634 4.80432 10.2237 4.86118 10.2932 4.90476C10.3628 4.94835 10.4402 4.9778 10.5212 4.99145C11.8157 5.20942 12.9142 6.30785 13.1337 7.60473C13.1584 7.75029 13.2339 7.8824 13.3467 7.97764C13.4595 8.07288 13.6025 8.1251 13.7501 8.12504C13.7854 8.12483 13.8207 8.12196 13.8556 8.11645C14.0189 8.08856 14.1645 7.99693 14.2604 7.8617C14.3562 7.72647 14.3944 7.55873 14.3665 7.39536Z"
                                    fill="#BFBFBF"
                                />
                            </svg>
                        </div>
                        <span>Lights</span>
                        <label class="switch">
                            <input
                                type="checkbox"
                                checked={controls.lights.on}
                                on:change={() => toggleControl("lights")}
                            />
                            <span class="slider"></span>
                        </label>
                        <span class="status" class:off={!controls.lights.on}>
                            {controls.lights.on ? "On" : "Off"}
                        </span>
                    </div>
                </div>

                <!-- Audio Input -->
                <div class="control-card">
                    <div class="control-row">
                        <div class="control-icon">
                            <svg
                                width="19"
                                height="18"
                                viewBox="0 0 19 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M11.1492 0.938399C11.0441 0.887184 10.9268 0.866477 10.8105 0.87863C10.6942 0.890783 10.5836 0.935309 10.4914 1.00715L5.03516 5.25012H1.5C1.16848 5.25012 0.850537 5.38181 0.616116 5.61623C0.381696 5.85066 0.25 6.1686 0.25 6.50012V11.5001C0.25 11.8316 0.381696 12.1496 0.616116 12.384C0.850537 12.6184 1.16848 12.7501 1.5 12.7501H5.03516L10.4914 16.9931C10.5837 17.0649 10.6944 17.1093 10.8107 17.1213C10.927 17.1334 11.0444 17.1125 11.1495 17.0612C11.2545 17.0098 11.3431 16.93 11.405 16.8308C11.467 16.7316 11.4999 16.6171 11.5 16.5001V1.50012C11.5 1.38303 11.4671 1.26829 11.4051 1.16898C11.3431 1.06967 11.2544 0.989771 11.1492 0.938399ZM1.5 6.50012H4.625V11.5001H1.5V6.50012ZM10.25 15.222L5.875 11.8196V6.18059L10.25 2.77824V15.222ZM14.4688 6.93449C14.9715 7.50518 15.2488 8.2396 15.2488 9.00012C15.2488 9.76064 14.9715 10.4951 14.4688 11.0657C14.3583 11.1871 14.2046 11.2601 14.0408 11.2691C13.877 11.2781 13.7162 11.2224 13.5932 11.1139C13.4701 11.0054 13.3947 10.8529 13.3831 10.6892C13.3715 10.5256 13.4247 10.3639 13.5312 10.2392C13.8327 9.89681 13.999 9.45629 13.999 9.00012C13.999 8.54395 13.8327 8.10343 13.5312 7.76105C13.4247 7.6363 13.3715 7.47467 13.3831 7.31102C13.3947 7.14738 13.4701 6.99485 13.5932 6.88636C13.7162 6.77786 13.877 6.7221 14.0408 6.73111C14.2046 6.74011 14.3583 6.81316 14.4688 6.93449ZM18.375 9.00012C18.3759 10.5378 17.8092 12.0217 16.7836 13.1673C16.6723 13.2878 16.518 13.3596 16.3542 13.3674C16.1903 13.3752 16.03 13.3182 15.9077 13.2088C15.7855 13.0994 15.7112 12.9463 15.7008 12.7826C15.6905 12.6189 15.7449 12.4577 15.8523 12.3337C16.6722 11.417 17.1254 10.2303 17.1254 9.00051C17.1254 7.77068 16.6722 6.58399 15.8523 5.6673C15.7961 5.60641 15.7525 5.53494 15.7241 5.45703C15.6957 5.37913 15.6831 5.29636 15.687 5.21354C15.691 5.13072 15.7113 5.0495 15.7469 4.97463C15.7826 4.89976 15.8327 4.83272 15.8945 4.77742C15.9563 4.72212 16.0284 4.67967 16.1068 4.65253C16.1851 4.62539 16.2681 4.61412 16.3508 4.61935C16.4336 4.62459 16.5145 4.64624 16.5888 4.68304C16.6631 4.71985 16.7293 4.77106 16.7836 4.83371C17.8095 5.97888 18.3762 7.46263 18.375 9.00012Z"
                                    fill="#BFBFBF"
                                />
                            </svg>
                        </div>
                        <span>Audio</span>
                        <label class="switch">
                            <input
                                type="checkbox"
                                checked={controls.audioInput.on}
                                on:change={() => toggleControl("audioInput")}
                            />
                            <span class="slider"></span>
                        </label>
                        <span
                            class="status"
                            class:off={!controls.audioInput.on}
                        >
                            {controls.audioInput.on ? "On" : "Off"}
                        </span>
                    </div>
                </div>

                <!-- Audio Output -->
                <div class="control-card">
                    <div class="control-row">
                        <div class="control-icon">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M18.125 5V3.75C18.125 3.41848 17.9933 3.10054 17.7589 2.86612C17.5245 2.6317 17.2065 2.5 16.875 2.5H3.125C2.79348 2.5 2.47554 2.6317 2.24112 2.86612C2.0067 3.10054 1.875 3.41848 1.875 3.75V5C1.875 5.33152 2.0067 5.64946 2.24112 5.88388C2.47554 6.1183 2.79348 6.25 3.125 6.25V13.75H2.5C2.33424 13.75 2.17527 13.8158 2.05806 13.9331C1.94085 14.0503 1.875 14.2092 1.875 14.375C1.875 14.5408 1.94085 14.6997 2.05806 14.8169C2.17527 14.9342 2.33424 15 2.5 15H9.375V16.3578C8.95799 16.5052 8.60653 16.7954 8.38273 17.1769C8.15893 17.5584 8.07721 18.0067 8.152 18.4426C8.2268 18.8786 8.45329 19.274 8.79146 19.5591C9.12963 19.8442 9.5577 20.0006 10 20.0006C10.4423 20.0006 10.8704 19.8442 11.2085 19.5591C11.5467 19.274 11.7732 18.8786 11.848 18.4426C11.9228 18.0067 11.8411 17.5584 11.6173 17.1769C11.3935 16.7954 11.042 16.5052 10.625 16.3578V15H17.5C17.6658 15 17.8247 14.9342 17.9419 14.8169C18.0592 14.6997 18.125 14.5408 18.125 14.375C18.125 14.2092 18.0592 14.0503 17.9419 13.9331C17.8247 13.8158 17.6658 13.75 17.5 13.75H16.875V6.25C17.2065 6.25 17.5245 6.1183 17.7589 5.88388C17.9933 5.64946 18.125 5.33152 18.125 5ZM10 18.75C9.87639 18.75 9.75555 18.7133 9.65277 18.6447C9.54999 18.576 9.46988 18.4784 9.42257 18.3642C9.37527 18.25 9.36289 18.1243 9.38701 18.0031C9.41112 17.8818 9.47065 17.7705 9.55806 17.6831C9.64547 17.5956 9.75683 17.5361 9.87807 17.512C9.99931 17.4879 10.125 17.5003 10.2392 17.5476C10.3534 17.5949 10.451 17.675 10.5197 17.7778C10.5883 17.8805 10.625 18.0014 10.625 18.125C10.625 18.2908 10.5592 18.4497 10.4419 18.5669C10.3247 18.6842 10.1658 18.75 10 18.75ZM3.125 3.75H16.875V5H3.125V3.75ZM15.625 13.75H4.375V6.25H15.625V13.75Z"
                                    fill="#BEBEBE"
                                />
                            </svg>
                        </div>
                        <span>Audio</span>
                        <label class="switch">
                            <input
                                type="checkbox"
                                checked={controls.audioOutput.on}
                                on:change={() => toggleControl("audioOutput")}
                            />
                            <span class="slider"></span>
                        </label>
                        <span
                            class="status"
                            class:off={!controls.audioOutput.on}
                        >
                            {controls.audioOutput.on ? "On" : "Off"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    /* Menu Strip Styles */
    .layout {
        display: flex;
        height: 100vh;
        position: relative;
        width: 100%;
        color: white;
        border-radius: 24px;
    }

    /* Icon Menu Styles */
    .icon-menu {
        width: 6vw;
        background-color: black;
        color: #ffffff;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 7px 0;
        box-sizing: border-box;
        border-top-left-radius: 24px;
        border-bottom-left-radius: 24px;
        margin-left: 1px;
    }

    .logo {
        width: 100%;
        height: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 2rem;
        margin-top: 10px;
    }

    .logo img {
        width: 100%;
        height: auto;
    }

    .menu-items {
        margin-top: 7vh;
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        border-radius: 24px;
        color: white;
        align-items: center;
        /* padding: 0px 10px; */
    }

    .menu-item {
        width: 40px;
        height: 40px;
        background: #20242b;
        border: none;
        transform: scale(1);
        color: #ffffff;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all 0.2s ease;
        font-size: 1.2rem;
        /* font-family: "Segoe UI Symbol", "Apple Color Emoji", sans-serif; */
        border-radius: 24px;
    }

    .menu-item:hover {
        background-color: #20242b;
        color: #ffffff;
        transform: scale(1.1);
    }

    .menu-item.active {
        color: #ffffff;
        background-color: rgba(2, 136, 6, 0.938);
        border-radius: 24px;
    }

    .bottom-icons {
        background-color: transparent;
        margin-top: auto;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
        background-color: none !important;
        align-items: center;
    }

    .exit {
        background-color: transparent;
        margin-bottom: 10px;
    }

    .exit .icon {
        background-color: transparent;
        background-color: none !important;
    }
    .settings {
        background-color: transparent;
        /* margin-bottom: 10px; */
    }
    /* Controls Panel Styles */
    .controls-panel {
        width: 247px;
        background: #000000;
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        border-top-right-radius: 24px;
        border-bottom-right-radius: 24px;
    }

    .header {
        padding: 10px 16px;
        /* border-bottom: 1px solid rgba(255, 255, 255, 0.1); */
    }

    .controls {
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        border-radius: 24px;
    }
    .back-button {
        color: rgba(109, 108, 108, 0.726);
        font-size: 1.2rem;
    }
    .control-card {
        background: #1c1c1e;
        border-radius: 12px;
        padding: 5px;
        width: 204px;
        height: 78px;
    }

    .control-row {
        display: flex;
        align-items: center;
        gap: 6px;
        position: relative;
    }

    .control-icon {
        width: 32px;
        height: 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        /* gap: 4px; */
        margin-top: 10px;
    }

    span {
        flex: 1;
        font-size: 14px;
        color: white;
    }

    .status {
        position: absolute;
        left: 40px;
        bottom: -20px;
        font-size: 12px;
        color: white;
        text-align: center;
        width: 32px;
    }

    .status::after {
        content: "";
        display: inline-block;
        width: 8px;
        height: 8px;
        background-color: #34c759; /* Green for ON state */
        border-radius: 50%;
        margin-left: 7px;
        vertical-align: middle;
    }

    .status.off::after {
        background-color: #ff453a; /* Red for OFF state */
    }

    /* Remove the color change for text */
    .status.off {
        color: white;
    }

    /* Switch styles */
    .switch {
        right: 0;
        top: 2vh;
        margin-right: 1vw;
        position: absolute;
        display: inline-block;
        width: 51px;
        height: 31px;
        margin-top: 10px;
    }

    .switch input {
        opacity: 0;
        width: 0px;
        height: 0;
        margin-left: -20px;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #39393d;
        transition: 0.2s;
        border-radius: 34px;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 20px;
        width: 20px;
        left: 2px;
        bottom: 5px;
        background-color: white;
        transition: 0.2s;
        border-radius: 50%;
    }

    input:checked + .slider {
        background-color: #34c759;
    }

    input:checked + .slider:before {
        transform: translateX(25px);
    }

    .menu-icon {
        width: 20px;
        height: 20px;
        filter: brightness(0) invert(1);
        transition: filter 0.2s ease;
    }

    .menu-item:hover .menu-icon {
        filter: brightness(0) invert(1);
    }

    .menu-item.active .menu-icon {
        filter: brightness(0) invert(1);
    }
</style>

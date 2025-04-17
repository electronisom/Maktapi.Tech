<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    // State for different controls
    let lights = {
        status: true,
        label: "Lights",
    };

    let audio = {
        status: false,
        label: "Audio",
    };

    let audioTwo = {
        status: true,
        label: "Audio",
    };

    // Projector status indicators
    let projectorStatus = {
        fan: { status: "ok", label: "Fan" },
        cover: { status: "fault", label: "Cover" },
        lamp: { status: "ok", label: "Lamp" },
        filter: { status: "ok", label: "Filter" },
        temperature: { status: "warn", label: "Temperature" },
        other: { status: "ok", label: "Other" },
    };

    function toggleControl(control) {
        control.status = !control.status;
        dispatch("controlToggle", {
            control: control.label,
            status: control.status,
        });
    }
</script>

<div class="lighting-container">
    <!-- </div> -->
    <h2 class="lighting-title">Immersive Room</h2>
    <div class="status-section">
        <div class="status-card">
            <h2>Projectors</h2>
            <div class="status-grid">
                {#each Object.entries(projectorStatus) as [key, status]}
                    <div class="status-item">
                        <div class="status-label">{status.label}</div>
                        <div
                            class="status-value"
                            class:ok={status.status === "ok"}
                            class:warn={status.status === "warn"}
                            class:fault={status.status === "fault"}
                        >
                            <div class="status-dot"></div>
                            {status.status === "ok"
                                ? "Ok"
                                : status.status === "warn"
                                  ? "Warm"
                                  : "Fault"}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    .lighting-title {
        /* font-weight: 800; */
        /* font-size: 20px; */
        margin-top: 7vh;
        margin-bottom: 10px;
        padding: 1vh;
        color: #333333a1;
    }
    .lighting-container {
        margin-top: -10vh;
        margin-left: -5vh;
        right: 0;
        bottom: 0;
        /* background: #1C1C1E; */
        color: #333333;
        height: 100vh;
        padding: 2rem;
        box-sizing: border-box;
        border-radius: 24px;
    }

    .header h1 {
        color: white;
        font-size: 1.5rem;
        font-weight: 500;
        margin: 0 0 2rem 0;
    }

    .controls-section {
        margin-bottom: 2rem;
    }

    .control-group {
        background: #2c2c2e;
        /* border-radius: 24px; */
        padding: 1rem;
    }

    .control-item {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .control-item:last-child {
        border-bottom: none;
    }

    .control-icon {
        width: 40px;
        height: 40px;
        background: #3a3a3c;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 1rem;
        color: #ffffff;
    }

    .control-info {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .control-label {
        color: white;
        font-size: 1rem;
        font-weight: 500;
    }

    .toggle-switch {
        background: rgba(255, 255, 255, 0.1);
        width: 51px;
        height: 31px;
        border-radius: 34px;
        position: relative;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    .toggle-switch.active {
        background: #34c759;
    }

    .toggle-slider {
        position: absolute;
        height: 27px;
        width: 27px;
        left: 2px;
        bottom: 2px;
        background: white;
        border-radius: 50%;
        transition: transform 0.3s;
    }

    .toggle-switch.active .toggle-slider {
        transform: translateX(20px);
    }

    .status-section {
        width: 602px;
        height: 238px;
        margin-top: 2rem;
    }

    .status-card {
        background: white;
        border-radius: 24px;
        padding: 5vh;
        padding-bottom: 10vh;
    }

    .status-card h2 {
        color: rgba(25, 29, 36, 0.466);
        font-size: 1.25rem;
        font-weight: 500;
        margin: 0 0 1.5rem 0;
    }

    .status-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
    }

    .status-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .status-label {
        color: #333;
        font-size: 0.9rem;
    }

    .status-value {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }

    .status-value.ok {
        color: #34c759;
    }

    .status-value.ok .status-dot {
        background: #34c759;
    }

    .status-value.warn {
        color: #ff9500;
    }

    .status-value.warn .status-dot {
        background: #ff9500;
    }

    .status-value.fault {
        color: #ff3b30;
    }

    .status-value.fault .status-dot {
        background: #ff3b30;
    }
</style>

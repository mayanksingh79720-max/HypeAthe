const fs = require('fs');

// We'll write the SVGs and check their validity
const runningSvg = `
<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Speed lines on left -->
  <path d="M14 24h10l-2 2.5H14z" fill="#FF6B24"/>
  <path d="M7 32h17l-3 2.5H7z" fill="#FF6B24"/>
  <path d="M12 40h12l-2.5 2.5H12z" fill="#FF6B24"/>
  
  <!-- Shoe Upper (Orange) -->
  <path d="M36 15c-1 0-3 1.5-3.5 3.5l-4 8.5 7 5.5c4-2 9-5 13-9.5l-3-4-3 1.5-2.5-4c-1.3-.7-2.7-1-4-1z" fill="#FF6B24"/>
  <path d="M28.5 27c-.8 1.8-1 4-.5 5.5 1 3 3.5 5 7 7 6 3.5 13 4.5 22 2l-1.5-5.5c-4 1-9 .8-13-1-3.5-1.5-6-3.5-8-6.5l-6-1.5z" fill="#FF6B24"/>

  <!-- Ankle Collar Trim (Dark / Theme) -->
  <path d="M35 15l2-3.5c1.5.5 3 1.2 4.5 2.2l-2 3.8c-1.5-.9-3-1.8-4.5-2.5z" fill="#1A1C1A" class="fill-[#1A1C1A] dark:fill-white"/>

  <!-- Laces (White accents) -->
  <path d="M41 21.5l3 2M43.5 24l3 2M46 26.5l3 2M48.5 29l3 2" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>

  <!-- Sole Base (Black / Dark) -->
  <path d="M26 31c-1 2.5-.5 5.5 1 7.5 3 4 8 7 15 8 9 1.2 16-1.5 21-6.5l-2.5-2c-4.5 4-10.5 6-18 5-6-.8-10.5-3.2-13-6.5-.8-1-1.2-2.5-.5-4.5l-3-1z" fill="#1A1C1A" class="fill-[#1A1C1A] dark:fill-white"/>

  <!-- Curved Midsole Stripe (White) -->
  <path d="M27.5 33c.5 3.5 4 6.5 9 8.2 6.5 2.2 13.5 1.5 19-3l-1.5-2.2c-4.5 3.5-10.5 4-16 2-4.5-1.5-7.5-3.8-8.5-6.5l-2 1.5z" fill="#FFFFFF"/>
</svg>
`;

console.log("Running SVG crafted");

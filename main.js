import html2canvas from "html2canvas";
import gameData from "./data";
import preloadImage from "./helpers";

const mainEl = document.getElementById('pageContent');
const navItems = document.querySelectorAll('nav > ul > li');
const navEl = document.querySelector('nav');
const infoText = document.getElementById('infoText');
const coverImgEl = document.getElementById('coverImg');
const animateDuration = 1000;

let numOfCols = 0;
let isMelting = false;

// Columns leave trails at bottom... make them move further at higher res
const bonusOffset = screen.availHeight <= 1080 ? 50 : (screen.availHeight > 1080 && screen.availHeight <= 1440) ? 200 : 500;

function animateColumn(ctx, imageData, startX, startY, endX, endY, colWidth, colHeight, duration, columnCount) {
  let startTime = null;
  
  function draw(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Calculate the current position based on elapsed time
      const progress = Math.min(elapsed / duration, 1); // Ensure progress doesn't exceed 1
      const currentX = startX + (endX - startX) * progress;
      const currentY = startY + (endY - startY) * progress;

      // Clear the canvas and draw the rectangle at the new position
      ctx.clearRect(startX, startY, colWidth, colHeight + navEl.offsetHeight + bonusOffset); // + offsetHeight since it seems to stop short of nav height

      // Draw the column at new position
      ctx.putImageData(imageData, currentX, currentY);

      // Continue animating until the duration is reached
      if (progress < 1) {
          requestAnimationFrame(draw);
      } else {
        numOfCols += 1;
        if (numOfCols >= columnCount) {
          console.log('Removed', numOfCols);
          mainEl.removeChild(mainEl.lastChild);
          numOfCols = 0;
          isMelting = false;
        } // Remove the canvas when last column is at the bottom
      }
  }

  requestAnimationFrame(draw);
}

function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

const manipulateCanvas = (canvas) => {
  console.log('Manipulate started', canvas);
  const ctx = canvas.getContext('2d');
  const canvasWidth = canvas.offsetWidth;
  const canvasHeight = canvas.offsetHeight;
  // How wide should each column be
  const columnTargetWidth = canvasWidth / 180; // 160 slices in the OG doom
  const columns = [];

  for(let x = 0; x < canvasWidth; x += columnTargetWidth) {
    columns.push({ 
      position: { x, y: 0, width: columnTargetWidth, height: canvasHeight },
      imageData: ctx.getImageData(x, 0, columnTargetWidth + 2, canvasHeight) }); // +2 for the colWidth to eliminate tiny gaps
  }

  console.log('cols', columns);

  // Mimic Doom's random delay feature, get a first initial delay value, then increase, decrease or stay the same for each column
  const possibleDelays = Array.from({ length: 10 }, (current, i) => i * 50); // Delays are at 50ms intervals
  let baseDelayIndex = getRandomInt(0, possibleDelays.length);

  for (let i = 0; i < columns.length; i++) {
    // Generate a random delay between 0 and 1000 ms
    setTimeout(() => {
      animateColumn(
        ctx,
        columns[i].imageData,
        columns[i].position.x,
        columns[i].position.y,
        columns[i].position.x,
        canvasHeight + navEl.offsetHeight + bonusOffset,
        columns[i].position.width,
        columns[i].position.height,
        animateDuration,
        columns.length,
      );
    }, possibleDelays[baseDelayIndex]);
    baseDelayIndex = getNextIndex(baseDelayIndex, possibleDelays);
  }
}

const getNextIndex = (currentIndex, possibleValues) => {
  if (currentIndex === 0) {
    // Either increase or stay the same
    return Math.random() > 0.5 ? currentIndex += 1 : currentIndex;
  }
  if (currentIndex === possibleValues.length - 1) {
    // Either decrease or stay the same
    return Math.random() > 0.5 ? currentIndex -= 1 : currentIndex;
  }
  const randomVal = Math.random();
  // Either increase, decrease or stay the same:
  if (randomVal >= 0 && randomVal <= 0.33) {
    return currentIndex -= 1;
  } else  if (randomVal >= 0.33 && randomVal <= 0.66) {
    return currentIndex;
  }
  return currentIndex += 1;
}

const startMelt = (pageSelected) => {
  isMelting = true;
  const mainWidth = mainEl.offsetWidth;
  const mainHeight = mainEl.offsetHeight;
  html2canvas(mainEl, { width: mainWidth, height: mainHeight, scale: 1 }).then(function(canvas) {
    mainEl.appendChild(canvas);
    loadMainContent(pageSelected).then((res) => {
      manipulateCanvas(canvas);
    });
  });
};

const loadMainContent = async (id) => {
  await preloadImage(gameData[id].backgroundImage, () => {
    mainEl.style.backgroundImage = `url(${gameData[id].backgroundImage})`;
  })
  await preloadImage(gameData[id].cover, () => {
    coverImgEl.setAttribute('src', gameData[id].cover);
  })
  infoText.innerText = gameData[id].description;
}

const handleNavClick = (ev) => {
  if (isMelting) return;
  const pageSelected = ev.target.dataset.game;
  for (let i = 0; i < navItems.length; i++) {
    navItems[i].classList.remove('activeNav');
  }
  navItems[pageSelected - 1].classList.add('activeNav');
  startMelt(pageSelected);
}

document.addEventListener('DOMContentLoaded', (event) => {
  // buttonEl.addEventListener('click', handleClick);
  for(let i = 0; i < navItems.length; i++) {
    navItems[i].addEventListener('click', handleNavClick);
  }
});

loadMainContent(1);

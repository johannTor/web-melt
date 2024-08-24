import html2canvas from "html2canvas";
import gameData from "./data";

// const appEl = document.getElementById('app');
const mainEl = document.getElementById('pageContent');
const buttonEl = document.getElementById('takeShot');
const navItems = document.querySelectorAll('nav > ul > li');
console.log('All LI:', navItems);

let numOfCols = 0;
let isMelting = false;

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
      ctx.clearRect(startX, startY, colWidth, colHeight + 200); // + 200 since it doesnt clear all the way down?

      // Draw the column at new position
      ctx.putImageData(imageData, currentX, currentY);

      // Continue animating until the duration is reached
      if (progress < 1) {
          requestAnimationFrame(draw);
      } else {
        numOfCols += 1;
        if (numOfCols >= columnCount) {
          console.log('Removed', numOfCols);
          mainEl.removeChild(mainEl.firstChild);
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
  const ctx = canvas.getContext('2d');
  const canvasWidth = canvas.offsetWidth;
  const canvasHeight = canvas.offsetHeight;
  // How wide should each column be
  const columnTargetWidth = canvasWidth / 160; // 160 slices in the OG doom
  const columns = [];

  for(let x = 0; x < canvasWidth - columnTargetWidth; x += columnTargetWidth) {
    columns.push({ 
      position: { x, y: 0, width: columnTargetWidth, height: canvasHeight },
      imageData: ctx.getImageData(x, 0, columnTargetWidth + 2, canvasHeight) }); // +2 for the colWidth to eliminate tiny gaps
  }

  // ToDo: Select image based on link clicked...
  // mainEl.style.backgroundImage = 'url(/d2m1.png)';

  console.log('cols', columns);

  // Mimic Doom's random delay feature, get a first initial delay value, then increase, decrease or stay the same for each column
  const possibleDelays = Array.from({ length: 10 }, (current, i) => (i + 1) * 100);
  let baseDelayIndex = getRandomInt(0, possibleDelays.length);

  for (let i = 0; i < columns.length; i++) {
    // Generate a random delay between 0 and 1000 ms
    setTimeout(() => {
      animateColumn(
        ctx, columns[i].imageData,
        columns[i].position.x,
        columns[i].position.y,
        columns[i].position.x,
        canvasHeight,
        columns[i].position.width,
        columns[i].position.height,
        1500,
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
  const appWidth = mainEl.offsetWidth;
  const appHeight = mainEl.offsetHeight;
  html2canvas(mainEl, { width: appWidth, height: appHeight }).then(function(canvas) {
    while (mainEl.firstChild) {
      mainEl.removeChild(mainEl.lastChild);
    }
    mainEl.appendChild(canvas);
    manipulateCanvas(canvas);
    loadMainContent(pageSelected);
  });
};

const loadMainContent = (id) => {
  mainEl.style.backgroundImage = `url(${gameData[id].backgroundImage})`;
  const pageContainer = document.createElement('div');
  pageContainer.setAttribute('id', 'pageContainer');
  const coverContainer = document.createElement('div');
  coverContainer.setAttribute('id', 'coverContainer');
  const imageTag = document.createElement('img');
  imageTag.setAttribute('id', 'coverImg');
  imageTag.setAttribute('alt', 'cover-demo');
  imageTag.setAttribute('src', gameData[id].cover);
  // ToDo: Add image src
  const sectionContainer = document.createElement('section');
  sectionContainer.setAttribute('id', 'infoContainer');
  const sectionText = document.createElement('span');
  sectionText.setAttribute('id', 'infoText');
  sectionText.innerText = gameData[id].description;

  coverContainer.appendChild(imageTag);
  sectionContainer.appendChild(sectionText);

  pageContainer.appendChild(coverContainer);
  pageContainer.appendChild(sectionContainer);
  mainEl.appendChild(pageContainer);
}

const handleNavClick = (ev) => {
  if (isMelting) return;
  const pageSelected = ev.target.dataset.game;
  for (let i = 0; i < navItems.length; i++) {
    navItems[i].classList.remove('activeNav');
  }
  navItems[pageSelected - 1].classList.add('activeNav');
  startMelt(pageSelected);
  console.log('pageSelected', pageSelected, typeof pageSelected);
}

document.addEventListener('DOMContentLoaded', (event) => {
  // buttonEl.addEventListener('click', handleClick);
  for(let i = 0; i < navItems.length; i++) {
    navItems[i].addEventListener('click', handleNavClick);
  }
});

loadMainContent(1);

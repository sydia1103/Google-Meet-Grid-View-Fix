// ==UserScript==
// @name         Google Meet Grid View
// @namespace    https://simonemarullo.github.io/
// @version      1.52.1
// @description  Adds a grid layout and some tweaks for Google Meets
// @author       Simone Marullo
// @include      https://meet.google.com/*
// @grant        none
// @run-at       document-idle
// @inject-into  content
// ==/UserScript==

// v1.40    Fixes
// v1.41    Fix disappearing names
// v1.42    CSS workaround for stacked tiles
// v1.43    Restored name modification
// v1.44    Restored 'show-only-video' option and pinning; implemented tile alphabetical sorting
// v1.45    Restored tile name transformation
// v1.46    Restored own video mirroring + better tile layout
// v1.47    Show own presentation in grid, customization of presentation tiles size (2x, 3x with grid-columns CSS)
// v1.48    Fix for pinning when presentation in grid
// v1.50    Minor fixes and mutesync integration
// v1.51    Advanced hide controls
// v1.52    Fixes

const gmgv_style = `
    .__gmgv-vid-container:not(.__gmgv-single-tile) {
      display: grid;
      gap: 0px 0px;
      grid-template-columns: repeat(auto-fit, minmax(30%, auto));
      grid-template-areas:
      ". . ."
      ". . ."
      ". . .";
      grid-auto-rows: 1fr;
      top: 50px !important;
      left: 2px !important;
      bottom: 90px !important;
    }
    .__gmgv-vid-container.__gmgv-9plus-tiles:not(.__gmgv-single-tile) {
      grid-template-areas:
      ". . . ."
      ". . . ."
      ". . . .";
      grid-template-columns: repeat(auto-fit, minmax(15%, auto));
    }
    .__gmgv-vid-container.__gmgv-30plus-tiles:not(.__gmgv-single-tile) {
      grid-template-areas:
      ". . . ."
      ". . . ."
      ". . . .";
      grid-template-columns: repeat(auto-fit, minmax(12%, auto));
    }
    .__gmgv-vid-container.__gmgv-rtb-resize.__gmgv-chat-enabled {
      right: 325px !important;
    }
    .__gmgv-vid-container.__gmgv-btb-resize.__gmgv-bottombar-enabled:not(.__gmgv-captions-enabled),
    .__gmgv-vid-container.__gmgv-btb-force:not(.__gmgv-captions-enabled) {
      bottom: 90px !important;
    }
    .__gmgv-vid-container.__gmgv-captions-enabled {
      bottom: 202px !important;
    }
    .__gmgv-vid-container.__gmgv-screen-capture-mode {
      right: 325px !important;
      bottom: 90px !important;
      z-index: 10;
      background: #111;
    }
    .__gmgv-vid-container.__gmgv-screen-capture-mode [data-self-name] {
      display: none;
    }
    .__gmgv-vid-container > div {
      position: relative !important;
      margin-top: 0 !important;
      top: 0 !important;
      left: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background: 0 0 !important;
    }
    .__gmgv-vid-container div[__gmgv-tile-type="you-are-presenting"][__gmgv-hidden="yes"], .__gmgv-vid-container div[__gmgv-tile-type="other-presentation"][__gmgv-hidden="yes"], .__gmgv-vid-container div[__gmgv-tile-type="user"][__gmgv-hidden="yes"], .__gmgv-vid-container.__gmgv-show-only-video div[__gmgv-has-video="false"] {
      display:none;
    }
    .__gmgv-vid-container > div[__gmgv-tile-type="user"]:after, .__gmgv-vid-container > div[__gmgv-tile-type="own-presentation"]:after, .__gmgv-vid-container > div[__gmgv-tile-type="other-presentation"]:after {
      content: "";
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 0.4em solid #64ffda;
      box-sizing: border-box;

      transition: opacity 300ms linear 500ms;
      opacity: 0;
      z-index: 1;
      pointer-events: none;
    }

    .__gmgv-sidebar-transformed .__gmgv-speaking-icon{
      display:none
    }

    .__gmgv-old-list{
      display:block;
    }
    .__gmgv-new-list{
      display:none;
    }

    .__gmgv-sidebar-transformed [role="list"]{
      display:none;
    }
    .__gmgv-sidebar-transformed .__gmgv-old-list{
      display:none
    }

    .__gmgv-sidebar-transformed .__gmgv-new-list{
      display:block
    }

    .__gmgv-vid-container > div > div:first-child {
      z-index: -2;
    }
    .__gmgv-vid-container > div[__gmgv-tile-type="user"] > div, .__gmgv-vid-container > div[__gmgv-tile-type="own-presentation"] > div, .__gmgv-vid-container > div[__gmgv-tile-type="other-presentation"] > div {
      display: flex !important;
      opacity: 1 !important;
    }

    .__gmgv-vid-container > div[__gmgv-tile-type="you-are-presenting"] > div > div {
      height: auto !important;
      margin-top: -40px;
      padding: 0px !important;
      width: auto !important;
    }
    .__gmgv-vid-container > div[__gmgv-tile-type="you-are-presenting"]{
     height:240px !important;
     width: 210px !important;
    }
     .__gmgv-vid-container > div[__gmgv-tile-type="you-are-presenting"] > div {
      width: min-content !important;
      height: min-content !important;
    }

    .__gmgv-vid-container:not(.__gmgv-screen-capture-mode) > div.__gmgv-speaking:after {
      transition: opacity 60ms linear;
      opacity: 1;
    }

    .__gmgv-vid-container.__gmgv-flip-self > div[__gmgv-me-tile="true"] video {
      transform: scaleX(1) !important;
    }

    .__gmgv-vid-container .__gmgv-alt-name-div{
       color:#fff;
       font-size:120%;
       margin-left:8px;
       overflow:hidden;
       text-overflow:ellipsis;
       text-shadow:0 0 2px rgba(0,0,0,0.80);
       white-space:nowrap;
       position: absolute;
       bottom: 13px;
       left: 44px;
       z-index: 100;
    }
    .__gmgv-vid-container.__gmgv-single-tile .__gmgv-alt-name-div{
       display:none
    }

    .__gmgv-duplicate-warning {
      color: #d93025;
      font-size: 1rem;
      display: flex;
      align-items: center;
      margin: 0 12px;
      font-weight: bold;
    }
    .__gmgv-duplicate-warning > svg {
      height: 36px;
      width: 36px;
      margin-right: 6px;
    }

    .__gmgv-button {
      display: flex;
      overflow: visible !important;
    }
    .__gmgv-button > svg {
      height: 24px;
      width: 24px;
      padding: 1em 2em;
    }
    .__gmgv-button > div {
      box-sizing: border-box;
      display: none;
      position: absolute;
      top: 40px;
      right: 0;
      width: 300px;
      padding: 12px;
      background: white;
      border-radius: 0 0 0 8px;
      text-align: left;
      cursor: auto;
      line-height: 0;
    }
    .__gmgv-button:hover > div {
      display: block;
    }
    .__gmgv-button > div label {
      display: flex;
      align-items: center;
      color: #999999;
      margin: 4px 0;
      line-height: 18px;
    }
    .__gmgv-button > div label:not(.disabled) {
      cursor: pointer;
      color: #000000;
    }
    .__gmgv-button input {
      margin-right: 8px;
    }
    .__gmgv-button > div small {
      line-height: 12px;
      font-weight: 400;
    }
    .__gmgv-button > div hr {
      border: 0;
      height: 1px;
      background: #f1f3f4;
    }
    .__gmgv-button .__gmgv-source-code {
      line-height: 16px;
    }
    .__gmgv-button .__gmgv-source-code small {
      border-right: 0.5px solid #f1f3f4;
      padding-right: 5px;
      margin-right: 2px;
    }
    .__gmgv-button .__gmgv-source-code a {
      font-size: 12px;
    }
    .__gmgv-button > div > a {
      display: inline-block;
      line-height: 20px;
    }

    .__gmgv-hide svg,
    .__gmgv-show-hide svg {
      height: 24px;
      width: 24px;
    }
    .__gmgv-hide > div {
      margin: 0 0 0 3px;
      color: #e8eaed;
      display: none;
    }
    .__gmgv-vid-container .__gmgv-hide > div,
    .__gmgv-show-hide > div {
      display: flex;
    }
    .__gmgv-hide > div,
    .__gmgv-show-hide > div {
      position: relative;
      overflow: visible;
      justify-content: center;
    }
    .__gmgv-hide > div > div,
    .__gmgv-show-hide > div > div {
      position: absolute;
      border-radius: 2px;
      background-color: rgba(95,99,104,0.9);
      color: #ffffff;
      pointer-events: none;
      font-size: 10px;
      font-weight: 500;
      padding: 5px 8px 6px;
      white-space: nowrap;
      transition: all 0.3s ease-in-out 0.3s;
      top: 31px;
      opacity: 0;
    }
    .__gmgv-hide:hover > div > div,
    .__gmgv-show-hide:hover > div > div {
      top: 46px;
      opacity: 1;
    }

    .__gmgv-settings {
      display: none;
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 6000;
      background: rgba(0,0,0,0.6);
      align-items: center;
      justify-content: center;
    }
    .__gmgv-settings > div {
      max-height: 70vh;
      max-width: 80vw;
      overflow: auto;
      background: white;
      border-radius: 8px;
      padding: 24px;
    }
    .__gmgv-settings > div > div {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: 500;
    }
    .__gmgv-settings > div > div > span:first-child {
      flex: 1 1 auto;
      margin-right: 20px;
    }
    .__gmgv-settings .__gmgv-close {
      line-height: 0;
      cursor: pointer;
      position: relative;
    }
    .__gmgv-settings .__gmgv-close svg {
      height: 24px;
      width: 24px;
    }
    .__gmgv-settings .__gmgv-close:before {
      content: "";
      display: block;
      position: absolute;
      top: -12px;
      left: -12px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      transition: background 300ms;
    }
    .__gmgv-settings .__gmgv-close:hover:before {
      background: rgba(0,0,0,0.12);
    }
    .__gmgv-settings label {
      display: block;
      margin-top: 24px;
    }
    .__gmgv-settings label > span {
      display: block;
      color: #00796b;
      font-size: 14px;
      line-height: 20px;
      font-weight: 500;
    }
    .__gmgv-settings label > select {
      display: block;
      height: 36px;
      width: 100%;
      padding: 8px 0;
      border: 0;
      border-bottom: 1px solid rgba(0,0,0,0.12);
      font-family: inherit;
      font-size: 14px;
      line-height: 20px;
      font-weight: 500;
    }
    .__gmgv-settings label option {
      padding: 0;
      font-size: 14px;
      line-height: 20px;
      font-weight: 500;
    }

    /* Fix disappearing names */
    .__gmgv-vid-container .sqgFe {
		opacity: 1 !important;
		display: flex !important;
	}

    .__gmgv-vid-container div[__gmgv-name-transformed="false"] .__gmgv-alt-name-div{
       display:none;
    }
    .__gmgv-vid-container div[__gmgv-name-transformed="true"] .sqgFe div:last-child{
       display:none;
    }
    .__gmgv-vid-container.__gmgv-single-tile div[__gmgv-name-transformed="true"] .sqgFe div:last-child{
       display:block;
    }
    .__gmgv-vid-container.__gmgv-single-tile div[__gmgv-added="true"]{
       display:none;
    }
    .__gmgv-vid-container.__gmgv-presentation-1x div[__gmgv-tile-type="own-presentation"], .__gmgv-vid-container.__gmgv-presentation-1x div[__gmgv-tile-type="other-presentation"]{
       grid-row: span 1;
       grid-column: span 1;
       order: -1 !important;
    }
    .__gmgv-vid-container.__gmgv-presentation-2x div[__gmgv-tile-type="own-presentation"], .__gmgv-vid-container.__gmgv-presentation-2x div[__gmgv-tile-type="other-presentation"]{
       grid-row: span 2;
       grid-column: span 2;
       order: -1 !important;
    }
    .__gmgv-vid-container.__gmgv-presentation-3x div[__gmgv-tile-type="own-presentation"], .__gmgv-vid-container.__gmgv-presentation-3x div[__gmgv-tile-type="other-presentation"]{
       grid-row: span 3;
       grid-column: span 3;
       order: -1 !important;
    }
    __gmgv-hidden-container{
       visibility: hidden;
    }
  `
        

;(function () {
  if (document.currentScript && document.currentScript.src === window.location.href.replace('popup.html', 'grid.user.js')) {
    window.TranslationFactory = TranslationFactory
  } else if (typeof unsafeWindow !== 'undefined') {
    const scriptData = `(function(){
      Main();
      ${TranslationFactory.toString()};
      ${Main.toString()};
    })()`

    const s = document.createElement('script')
    s.setAttribute('data-version', GM.info.script.version)
    s.src = URL.createObjectURL(new Blob([scriptData], { type: 'text/javascript' }))
    document.body.appendChild(s)
  } else {
    Main()
  }
  
  
  function TranslationFactory() {
    const translations = {
      en: {
        showOnlyVideo: 'Only show participants with video',
        highlightSpeaker: 'Highlight speakers',
        includeOwnVideo: 'Include yourself in the grid',
        autoEnable: 'Enable grid view by default',
        notRunning: 'Grid View is not running on this page',
        noMeeting: 'Grid View does not run until you join the meeting',
        enabled: 'Enable Grid View',
        currentRelease: 'Current release',
        donate: 'Support this extension! <br /><small>(make a small donation)</small>',
        donateAdvancedSettings: 'Please, show your interest for Grid View by making a small donation <a href="https://paypal.me/SimoneMarullo" target="_blank">here</a>.',
        advancedSettingsLink: 'View Advanced Settings',
        advancedSettingsTitle: 'Google Meet Grid View Advanced Settings',
        ownVideoBehavior: 'Own Video In Grid Behavior',
        ovbNative: 'Keep video mirrored',
        ovbFlip: 'Flip video to match what others see',
        presentationSize: 'Size of presentation tiles',
        psNormal: 'Normal (1x)',
        psLarger: 'Large (2x)',
        psMuchLarger: 'Very large (3x)',
        presentationBehavior: 'Own Presentation Behavior',
        youArePresentingBehavior: "'You are presenting' box Behavior",
        yapNever: 'Hide',
        yapAlways: 'Show',
        advancedHideControls: 'Enable advanced hide controls',
        pbNever: 'Never show presentation in grid',
        pbOwnVideo: 'Show presentation in grid when "Include yourself in the grid" is selected',
        pbAlways: 'Always show presentation in grid',
        modifyNames: 'Modify Participant Names',
        mnNative: 'No modification ("Alpha Bravo Charlie")',
        mnFirstSpace: 'Move first word to end ("Bravo Charlie, Alpha")',
        mnLastSpace: 'Move last word to start ("Charlie, Alpha Bravo")',
      }
    }

    const T = key =>
      navigator.languages
        .concat(['en'])
        .map(l => (translations[l] && translations[l][key]) || (translations[l.split('-')[0]] && translations[l.split('-')[0]][key]))
        .find(t => t)

    return T
  }

  function Main() {
    const T = TranslationFactory()

    const close = '<path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />'
    const alert = '<path fill="currentColor" d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />'
    
    const gmgv_settings_overlay_html =  `
          <div>
            <span style='color:brown'>Sorry, advanced features may not work as expected (under development).<br /><br /></span>
            <div>
              <span>${T('advancedSettingsTitle')}</span>
              <span class="__gmgv-close"><svg viewBox="0 0 24 24">${close}</svg></span>
            </div>
            <label style='opacity:1.0'>
              <span>${T('ownVideoBehavior')}</span>
              <select data-gmgv-setting="own-video">
                <option value="native">${T('ovbNative')}</option>
                <option value="flip">${T('ovbFlip')}</option>
              </select>
            </label>
            <label style='opacity:1.0'>
              <span>${T('presentationBehavior')}</span>
              <select data-gmgv-setting="presentation">
                <option value="never">${T('pbNever')}</option>
                <option value="always">${T('pbAlways')}</option>
              </select>
            </label>
            <label style='opacity:1.0'>
              <span>${T('presentationSize')}</span>
              <select data-gmgv-setting="presentation-size">
                <option value="1x">${T('psNormal')}</option>
                <option value="2x">${T('psLarger')}</option>
                <option value="3x">${T('psMuchLarger')}</option>
              </select>
            </label>
            <label style='opacity:1.0'>
              <span>${T('youArePresentingBehavior')}</span>
              <select data-gmgv-setting="you-are-presenting-box">
                <option value="never">${T('yapNever')}</option>
                <option value="always">${T('yapAlways')}</option>
              </select>
            </label>
            <label style='opacity:1.0'>
              <span>${T('modifyNames')}</span>
              <select data-gmgv-setting="names">
                <option value="native">${T('mnNative')}</option>
                <option value="last-space">${T('mnLastSpace')}</option>
              </select>
            </label>
            <span style="text-align: center;color: darkgreen;font-style: italic;font-size: 122%;"><br>${T('donateAdvancedSettings')}<br></span>
          </div>
        `

    // Create the styles we need
    const s = document.createElement('style')
    s.innerHTML = gmgv_style
    document.body.append(s)

    // Variables
    let container = null
    let hiddenContainer = null
    let toggleButton = null
    let settingsOverlay = null
    let forceReflow = () => {}
    let lastStyles = []
    let hiddenIDs = new Set()
    let hiddenTiles = new Set()
    let participantsMap = new Map()
    let ownParticipantId = null
    let ownID = null
    let sizingFuncOverwritten = false
    let settings = {
      enabled: false,
      'show-settings-overlay': false,
      'show-only-video': localStorage.getItem('gmgv-show-only-video') === 'true',
      'advanced-hide-controls': localStorage.getItem('gmgv-advanced-hide-controls') === 'true',
      'highlight-speaker': localStorage.getItem('gmgv-highlight-speaker') === 'true',
      'include-own-video': localStorage.getItem('gmgv-include-own-video') === 'true',
      'you-are-presenting-box': ['never', 'always'].find(v => v === localStorage.getItem('gmgv-you-are-presenting-box')) || 'never',
      'auto-enable': false,
      'bottom-toolbar': ['native', 'resize', 'force'].find(v => v === localStorage.getItem('gmgv-bottom-toolbar')) || 'resize',
      'right-toolbar': ['native', 'resize'].find(v => v === localStorage.getItem('gmgv-right-toolbar')) || 'resize',
      'own-video': ['native', 'flip'].find(v => v === localStorage.getItem('gmgv-own-video')) || 'native',
      'presentation-size': ['1x','2x','3x'].find(v => v === localStorage.getItem('gmgv-presentation-size')) || '1x',
      presentation: ['never', 'own-video', 'always'].find(v => v === localStorage.getItem('gmgv-presentation')) || 'never',
      names: ['native', 'first-space', 'last-space'].find(v => v === localStorage.getItem('gmgv-names')) || 'native',
      'force-quality': ['auto', '2', '3', '4', '5'].find(v => v === localStorage.getItem('gmgv-force-quality')) || 'auto',
    }
    


    const version =
      (document.currentScript && document.currentScript.dataset.version) || (typeof GM !== 'undefined' && GM && GM.info && GM.info.script && GM.info.script.version) || '?.?.?'
    let firstRun = true
    setInterval(() => {
      const participantVideo = document.querySelector('[data-allocation-index]')
      const _container = participantVideo && participantVideo.parentElement
      if (_container && _container !== container) {
        container = _container
        updateSetting('enabled', settings['enabled']) 
      }

      if (_container && !settingsOverlay) {
        settingsOverlay = document.createElement('div')
        settingsOverlay.classList.add('__gmgv-settings')
        document.body.appendChild(settingsOverlay)
        settingsOverlay.innerHTML = gmgv_settings_overlay_html
        settingsOverlay.onclick = () => updateSetting('show-settings-overlay', false)
        settingsOverlay.querySelector('div').onclick = e => e.stopPropagation()
        settingsOverlay.querySelector('.__gmgv-close').onclick = () => updateSetting('show-settings-overlay', false)
        settingsOverlay.querySelectorAll('select').forEach(el => {
          const settingName = el.dataset.gmgvSetting
          el.value = settings[settingName]
          el.onchange = e => updateSetting(settingName, e.target.value)
        })


      }

      const ownVideoPreview = document.querySelector('[data-resolution-cap]')
      const buttons = ownVideoPreview && ownVideoPreview.parentElement.parentElement.parentElement

      const presentation_container = buttons.childNodes[buttons.childNodes.length-2]
      if(settings['enabled']) setObserverButtonBarPresentation(presentation_container)
      // If user has other grid view extensions installed, warn them
      if (buttons && !buttons.__grid_ran2) {
        buttons.__grid_ran2 = true
      }
      if (buttons && !buttons.__grid_ran) {
        buttons.__grid_ran = true
        buttons.parentElement.parentElement.parentElement.style.zIndex = 10 

        buttons.prepend(buttons.children[1].cloneNode())

        toggleButton = document.createElement('div')
        toggleButton.classList = buttons.children[1].classList
        toggleButton.classList.add('__gmgv-button')
        toggleButton.onclick = () => {
          updateSetting('enabled', !settings['enabled'])
        }
        buttons.prepend(toggleButton)


	toggleButton.style.display = 'none'


      }

      if (firstRun && container && buttons) {
        firstRun = false
        if (settings['auto-enable']) updateSetting('autoenabled', true)
      }
    }, 1000)



    var observer;
    var timerNames = -1;
    var timerTiles = -1;
    var observerNames = -1;
    var observerButtonBarPresentation = -1;


    // This function is responsible of detecting if user has started own presentation
    function updateOwnPresentation(mutations){
        if(settings['enabled'] && settings['presentation'] === 'always'){
            for(var mutation of mutations) {
                if (mutation.type == 'childList' && mutation.addedNodes.length > 0) {
                    setTimeout(function() {
                        let vid = mutation.target.querySelector('video')
                        if(vid != null) bringOwnPresentationToGrid(vid);
                    }, 6000)
                }
                if (mutation.type == 'childList' && mutation.removedNodes.length > 0){
                    document.querySelectorAll('div[__gmgv-tile-type="own-presentation"]').forEach(d => {d.remove();});
                }

            }
        }
    }

    // This function is responsible of bringing user own presentation as a new tile in the grid
    function bringOwnPresentationToGrid(video){
        console.log('presentation video', video)
        console.log('container', container)
        if(settings['presentation'] === 'always'){
            let tile = document.createElement("div")
            tile.setAttribute('__gmgv-tile-type', 'own-presentation')
            tile.setAttribute('__gmgv-added', 'true')
            container.appendChild(tile)
            tile.appendChild(video)
        }
    }
    
    // Setting an observer responsible for noticing changes in the participants list
    function setObserverNames(participants_list){
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
            observerNames = new MutationObserver(function(mutations) {
                updateNames(true);
            });

            observerNames.observe(participants_list, {
                attributes: false,
                childList: true,
                characterData: false
            });
    }

    // Setting an observer responsible for detecting the start of own presentation
    function setObserverButtonBarPresentation(presentation_container){
        if (typeof presentation_container == 'undefined' || observerButtonBarPresentation != -1) {
            return;
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
            observerButtonBarPresentation = new MutationObserver(function(mutations) {
               updateOwnPresentation(mutations);
            });

            observerButtonBarPresentation.observe(presentation_container, {
                attributes: false,
                childList: true,
                characterData: false
            });
    }

    // Utility function: move last word to start
    function transformname(n){
      if(settings['names'] == "native") return n;

      let p = n.split(' ')
      p[p.length - 1] += ','
      p.push(p.shift())
      return p.join(' ')
    }


    // This function is responsible of hiding unwanted tiles and updating the layout
    function checkTiles(){
        let tiles = document.querySelectorAll('.__gmgv-vid-container > div')
        container.classList.toggle('__gmgv-9plus-tiles', false)
        container.classList.toggle('__gmgv-30plus-tiles', false)
        if(tiles.length > 30) container.classList.toggle('__gmgv-30plus-tiles', true)
        else if(tiles.length > 9) container.classList.toggle('__gmgv-9plus-tiles', true)

        tiles.forEach(d => {
            let participantId = d.getAttribute('data-initial-participant-id')
            let hiddenTile = hiddenTiles.has(participantId)

            if(d.hasAttribute('__gmgv-tile-type')  && d.getAttribute('__gmgv-tile-type') == 'own-presentation'){

            } else if(d.childNodes.length == 2 && d.querySelector('video') != null) {
                // Other presentation
                d.setAttribute('__gmgv-tile-type','other-presentation')
                if(hiddenTile) {
                    d.setAttribute('__gmgv-hidden','yes')
                } else {
                    d.setAttribute('__gmgv-hidden','no')
                }
            } else if(d.childNodes.length == 2 && d.children[0].childNodes.length == 1 && d.querySelector('video') == null) {
                d.setAttribute('__gmgv-tile-type','you-are-presenting')
                if(settings['you-are-presenting-box'] == 'never') {
                  d.setAttribute('__gmgv-hidden','yes')
                  //d.classList.toggle('__gmgv-hidden', true)
                } else {
                  d.setAttribute('__gmgv-hidden','no')
                  //d.classList.toggle('__gmgv-hidden', false)
                }
            } else {
                d.setAttribute('__gmgv-tile-type','user')
                if(hiddenTile) {
                    d.setAttribute('__gmgv-hidden','yes')
                } else {
                    d.setAttribute('__gmgv-hidden','no')
                }
            }

            if(d.getAttribute('__gmgv-name-transformed') == null) d.querySelectorAll('.__gmgv-alt-name-div').forEach(d => {d.remove();})

            let hasVideo = Array.from(d.querySelectorAll('video')).filter(s => window.getComputedStyle(s).getPropertyValue('display') != 'none').length > 0
            console.log(participantId, hasVideo)
            d.setAttribute('__gmgv-has-video', hasVideo)
            if(!hasVideo && settings['show-only-video']) {
                hiddenContainer.appendChild(d);
            }
        })

        let alt_tiles = document.querySelectorAll('.__gmgv-hidden-container > div')
        alt_tiles.forEach(d => {
            let hasVideo = Array.from(d.querySelectorAll('video')).filter(s => window.getComputedStyle(s).getPropertyValue('display') != 'none').length > 0
            d.setAttribute('__gmgv-has-video', hasVideo)
            if(hasVideo) {
                container.appendChild(d);
            }
        })


        if(Array.from(document.querySelectorAll('.__gmgv-vid-container > div')).filter(function (e) {return !((e.hasAttribute('__gmgv-hidden') && e.getAttribute('__gmgv-hidden') == 'yes') || e.hasAttribute('__gmgv-added'))}).length<=1){
            container.classList.toggle('__gmgv-single-tile', true)
        } else {
            container.classList.toggle('__gmgv-single-tile', false)
        }
    }

    function requestReflow(){
        console.log('Requesting reflow..')
    	window.postMessage({
              type:'reflow',
              sender: 'gmgv_user'
        })
    }

    // Callback for advanced-hide-controls changes
    function ahcCallback(participantId, showStatus){
        let askForReflow = false
        if(!showStatus) {
            hiddenTiles.add(participantId)
        } else {
            hiddenTiles.delete(participantId)
            askForReflow = true
        }
        console.log(hiddenTiles)
        checkTiles();
        if(askForReflow) requestReflow()
    }


    // This function is responsible of updating the participants list by adding advanced-hide-controls and transforming names
    // It will also broadcast the name transformation to the tiles in the grid
    function updateNames(forceUpdate = false) {
        function listItemsSorter(a, b) {
            return a.getAttribute('__gmgv-name').localeCompare(b.getAttribute('__gmgv-name'));
        }
        function Sorter(a, b) {
            return a[1].localeCompare(b[1]);
        }

        // forceUpdate is true when participants are added / removed

        // Mark transformed sidebar
        if(document.querySelector('[role="list"]:not(.__gmgv-transformed)') != null)
            document.querySelector('[role="list"]:not(.__gmgv-transformed)').parentNode.parentNode.classList.add('__gmgv-sidebar-transformed')

        let transformedNames = false
        let original_listitems = document.querySelectorAll('[role="listitem"]')
        original_listitems.forEach(d => {
            if (settings['advanced-hide-controls'] === true && d.querySelectorAll('input[type="checkbox"]').length == 0) {
                let check = document.createElement("input")
                check.type = "checkbox"
                check.style.display = "none"
                check.style.marginRight = "7px"
                if (hiddenTiles.has(d.getAttribute('data-participant-id'))) check.checked = false;
                else check.checked = true;
                d.children[0].prepend(check)
            }
            let sp = d.children[0].querySelector('div:first-child > span:first-child');
            d.children[1].children[0].classList.add('__gmgv-speaking-icon')
            if (!d.hasAttribute('__gmgv-name') || d.getAttribute('__gmgv-name') != sp.innerText) {
                // Transform list items
                if (!d.classList.contains('__gmgv-transformed')) transformedNames = true
                let oldname = sp.innerText
                let newname = transformname(oldname)
                participantsMap.set(d.getAttribute('data-participant-id'), newname)
                sp.innerText = newname
                sp.classList.toggle('__gmgv-transformed', true)
                if (sp.nextSibling != null) {
                	d.setAttribute('__gmgv-me-listitem', true)
                	ownParticipantId = d.getAttribute('data-participant-id')
                }
                d.setAttribute('__gmgv-name', newname)
                d.setAttribute('__gmgv-old-name', oldname)
                d.setAttribute('__gmgv-transformed', 'yes')
                d.classList.toggle('__gmgv-transformed', true)
            }

        })


        // Update tiles continuously
        const mapSort = new Map([...participantsMap.entries()].sort(Sorter));

        document.querySelectorAll('div[__gmgv-name-transformed="true"], div[__gmgv-me-tile="true"]').forEach(d => {
                    d.setAttribute('__gmgv-name-transformed', false);
                    d.setAttribute('__gmgv-me-tile', false);
        })

        var i = 0
        for (let entry of mapSort) {
            let participantId = entry[0]
            let participantName = entry[1]
            let tile = container.querySelector('div[data-initial-participant-id="' + participantId + '"]')

            if (participantId != null && tile != null) {
                tile.style.order = i
                tile.querySelectorAll('.__gmgv-alt-name-div').forEach(d => {
                    d.remove();
                })
                if (tile.children.length == 3) {
                    let altnamediv = document.createElement("div")
                    altnamediv.classList.add('__gmgv-alt-name-div')
                    altnamediv.innerText = participantName
                    tile.children[0].appendChild(altnamediv)
                    tile.setAttribute('__gmgv-name-transformed', true)
                    if (participantId == ownParticipantId) tile.setAttribute('__gmgv-me-tile', true)
                    i = i+1;
                }
            }

        }

        if(original_listitems.length == 0) {return;}

        // Pick items from old list and sort
        let oldlist = document.querySelector('[role="list"]:not(.__gmgv-transformed)')
        var categoryItems = oldlist.querySelectorAll('[role="listitem"]');
        var categoryItemsArray = Array.from(categoryItems).map(d => d.cloneNode(true));
        let sorted = categoryItemsArray.sort(listItemsSorter);


        if (forceUpdate || transformedNames || document.querySelectorAll('.__gmgv-transformed-list').length == 0) { // Then create a new list
            // Remove previous transformed lists
            document.querySelectorAll('.__gmgv-transformed-list').forEach(d => {
                d.remove();
            });

            oldlist.classList.toggle('__gmgv-old-list', true)

            // Create new list (empty) with correct classes
            let newlist = document.createElement("div")
            newlist.classList = oldlist.classList
            newlist.classList.toggle('__gmgv-old-list', false)
            newlist.classList.toggle('__gmgv-new-list', true)
            newlist.innerHTML = '';
            newlist.classList.toggle('__gmgv-transformed', true)

            // Populate new list with items
            for (var i = 0, n = sorted.length; i < n; ++i) {
                let e = sorted[i];
                e.classList.toggle('__gmgv-transformed', true);
                e.querySelectorAll('input[type="checkbox"]').forEach(el => {
                    el.style.display = "block"
                    el.onchange = function(ev) {
                        ahcCallback(e.getAttribute('data-participant-id'), ev.target.checked)
                    }
                })
                newlist.appendChild(e);
            }

            // Insert new list
            oldlist.parentNode.insertBefore(newlist, oldlist.sibling);
            newlist.classList.add('__gmgv-transformed-list')
        }

        if (observerNames == -1 && original_listitems.length > 0) {
            let observedlist = document.querySelector('[role="list"]:not(.__gmgv-transformed)')
            setObserverNames(observedlist);
        }
    }

    function startUpdatingNames(){
        if(timerNames==-1) timerNames = setInterval(updateNames, 1000);
    }

    function startCheckingTiles(){
        if(timerTiles==-1) timerTiles = setInterval(checkTiles, 3000);
    }

    function stopCheckingTiles(){
        if(timerTiles!=-1) clearInterval(timerTiles);
        timerTiles = -1;
    }

    function stopUpdatingNames(){
        if(timerNames!=-1) clearInterval(timerNames);
        if(observerNames!=-1) observerNames.disconnect();
        observerNames = -1;
        timerNames = -1;
        let d = document.querySelector('.__gmgv-sidebar-transformed')
        if(d != null)
            d.toggle('__gmgv-sidebar-transformed', false)
    }

    function updateSetting(name, value) {
      let ignoreReflow = false
      if(name == "autoenabled") {
          name = "enabled"
          ignoreReflow = true
      }
      settings[name] = value
      localStorage.setItem('gmgv-' + name, value)


      // Update container CSS
      if (container) {
        container.classList.toggle('__gmgv-vid-container', settings['enabled'])
        container.classList.toggle('__gmgv-flip-self', settings['own-video'] === 'flip')
        container.classList.toggle('__gmgv-show-only-video', settings['show-only-video'])

        if(!settings['enabled'] || !settings['show-only-video']){
            let alt_tiles = document.querySelectorAll('.__gmgv-hidden-container > div')
            alt_tiles.forEach(d => { container.appendChild(d); })
        }

        if (!settings['enabled']) {
          container.style.marginLeft = ''
          container.style.marginTop = ''
          stopUpdatingNames();
          stopCheckingTiles();
          container.classList.toggle('__gmgv-presentation-1x', false)
          container.classList.toggle('__gmgv-presentation-2x', false)
          container.classList.toggle('__gmgv-presentation-3x', false)
          document.querySelectorAll('div[__gmgv-added="true"]').forEach(d => {d.remove();});
          hiddenTiles.clear()
          if(hiddenContainer != null){
              hiddenContainer.remove()
              hiddenContainer = null
              requestReflow()
          }
        } else {
            if(hiddenContainer == null){
              hiddenContainer = document.createElement("div")
              hiddenContainer.classList.add('__gmgv-hidden-container')
              document.body.appendChild(hiddenContainer)
            }
            container.classList.toggle('__gmgv-presentation-1x', settings['presentation-size'] == '1x')
            container.classList.toggle('__gmgv-presentation-2x', settings['presentation-size'] == '2x')
            container.classList.toggle('__gmgv-presentation-3x', settings['presentation-size'] == '3x')
            if(settings['presentation'] === 'never') document.querySelectorAll('div[__gmgv-tile-type="own-presentation"]').forEach(d => {d.remove();});
            checkTiles();
            startCheckingTiles();
            if(settings['names'] == 'last-space' || settings['advanced-hide-controls'] === true) startUpdatingNames(); else {
                container.classList.toggle('__gmgv-name-transformed', false)
                stopUpdatingNames();
            }
            var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
            var list = document.querySelector('.__gmgv-vid-container');

            observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {

                });
                checkTiles();
            });

            observer.observe(list, {
                attributes: false,
                childList: true,
                characterData: false
            });
        }

      }

      // Update settings CSS
      if (settingsOverlay) {
        settingsOverlay.style.display = settings['show-settings-overlay'] ? 'flex' : ''
      }

      if (!settings['enabled']) {
        hiddenIDs = new Set()
      }

      // Force a reflow to pick up the new settings
      if(name == "enabled" && value === true && !ignoreReflow) requestReflow()
    }

    // In-browser message passing
    window.addEventListener('message', event => {
      if (event.source !== window) return // Only accept messages from current window
      if (event.data.sender !== 'gmgv_content') return // Only accept messages from content.js
      try {
        switch (event.data.type) {
          case 'getState':
            window.postMessage({
              id: event.data.id,
              sender: 'gmgv_user',
              inMeeting: !!container,
              settings,
            })
            break
          case 'updateSetting':
            updateSetting(event.data.name, event.data.value)
            window.postMessage({
              id: event.data.id,
              sender: 'gmgv_user',
              success: true,
            })
            break
          default:
            window.postMessage({
              id: event.data.id,
              sender: 'gmgv_user',
              error: 'unknown message',
            })
            break
        }
      } catch (error) {
        window.postMessage({
          id: event.data.id,
          sender: 'gmgv_user',
          error,
        })
      }
    })
  }
})()


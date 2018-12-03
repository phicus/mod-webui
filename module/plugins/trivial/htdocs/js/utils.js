const obEach = (object, func) => Object.entries(object).forEach(([k, v]) => func(k, v));
const getEdgeToParent = node => node._private.edges.filter(edge => node.data().id === edge.data().source)[0];
// TODO: Use this in selectPath function
const getParent = node => getEdgeToParent(node) && cy.$(`#${getEdgeToParent(node).data().target}`)[0];
const setupZoom = async _ => await sleep(300) && cy.zoom(cy.maxZoom() / 20) && cy.center();
const sleep = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
const initButtons = _ => $('#loader').hide() && $('#work-mode, #center, #trivial').show();
const initNavigator = (options = undefined) => cy.navigator(options);
const savePosition = async () => alertify.confirm("Do you want to save?", _ => saveToLocalStorage() && saveToServer());
const loadPosition = async (shouldUnlock) => {await loadPositionFromLocalStorage(shouldUnlock); loadPositionFromServer(shouldUnlock)};
const elementById = id => cy.getElementById(id.startsWith("#") ? id : `#${id}`);
const setPositions = data => obEach(data, (k, v) => ele = this.cy.getElementById(k).position(v.position));
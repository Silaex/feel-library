import StateSystem from './state.js';
import { ROUTING_CURRENT_PATH_NAME, ROUTING_STATE_NAME } from './constants.js';
import { typeVerification } from './utils.js';

export default (function Feel() {
    /**
     * Function that is here for pratical reason (put methods newly created here)
     */
    function methodsExport() {
        return {
            Initialize,
            renderToDOM,
            setFavicon,
            ...StateSystem,
            ...Routing,
            createElement,
            addStylesheet
        }
    }

    /**
     * @description Set the page favicon
     * @param {string} path 
     * @param {string} type - Default type is **ico**
     */
    function setFavicon(path = "", type = "ico") {
        console.log(path);
        if (typeVerification([path, "string"], [type, "string"])) {
            if (path && type) {
                const favicon = createElement("link", { rel: "icon", type: `image/${type}`, href: path })
                document.head.append(favicon);
                return;
            } else {
                throw Error("Path and image type must not be blank");
            }
        }
        throw TypeError("The path of the favicon must be a string");
    }

    const Initialize = function() {
        document.body.appendChild(
            createElement('div', {
                id: "root"
            })
        )
    };

    /**
     * Render components or elements to DOM
     * @param {HTMLElement[]} elements 
     */
    function renderToDOM(elements) {
        const rootNode = document.getElementById("root");
        if (!rootNode) throw Error("The root div is missing. Check if Feel.Initialize() have been invoked.");

        while (rootNode.firstChild) {
            rootNode.removeChild(rootNode.lastChild);
        }
        // We change the unique value to an array one to fit the append
        if (!Array.isArray(elements)) elements = Array(elements);
        rootNode.append(...elements);
    }

    //#region RoutingSystem
    const Routing = (function() {
        let routingEnabled = false;
        const missingRouterErrorMessage = "Bad use of Feel.Link(). Please check that you have initialized the Router";

        /**
         * @description Route creation
         * @param {string} pathName 
         * @param {HTMLElement[]} components 
         */
        function createRoute(pathName = null, components = null) {
            const paths = StateSystem.getState(ROUTING_STATE_NAME);

            if (typeof pathName === "string") {
                paths[pathName] = components;
                StateSystem.dispatch(ROUTING_STATE_NAME, paths);
            } else {
                throw TypeError("the path's name must be a string");
            }
        }

        let windowLocationPathOrigin;
        
        /**
         * @description Routing Initialisation
         * @param {string} homePath - Path that will handle the base of every route
         * @param {[{ pathname: string, components: HTMLElement[] | HTMLElement }]} routes - Path that will handle the base of every route
         */
        const Router = function RouterInitializer(homePath = "/", routes = []) {

            
            windowLocationPathOrigin = window.location.origin + homePath;
            StateSystem.addState(ROUTING_STATE_NAME, {});
            StateSystem.addState(ROUTING_CURRENT_PATH_NAME, "");
            
            StateSystem.subscribe(function (states) {
                const paths = StateSystem.getState(ROUTING_STATE_NAME);
                const currentPathname = states[ROUTING_CURRENT_PATH_NAME];
                
                renderToDOM(paths[currentPathname]);
            }, [ROUTING_CURRENT_PATH_NAME]);
            
            // Routes initialization
            if (Array.isArray(routes)) {
                routes.forEach(route => createRoute(route.pathname, route.components));
            } else {
                throw Error("routes must be an Array");
            }
            
            // Redirection to the correct route
            function inatializationRedirection() {
                const historyPathState = history.state?.FeelPath;
                if (historyPathState) {
                    StateSystem.dispatch(ROUTING_CURRENT_PATH_NAME, historyPathState);
                } else {
                    StateSystem.dispatch(ROUTING_CURRENT_PATH_NAME, homePath);
                }
            }

            inatializationRedirection();
            
            window.addEventListener("popstate", function(event) {
                inatializationRedirection();
            });
            // We set that the router is intialized so we can handle of illegal use
            // of Link element
            routingEnabled = true;
        }

        /**
         * @description Link creation
         * @param {String} href 
         * @param {HTMLAnchorElement} props 
         * @param {HTMLElement[]} childrens 
         * @returns {HTMLElement}
         */
        const Link = function LinkElement(href, props, childrens) {

            let onClickProp = function () {};
            if (props && props.onclick) {
                onClickProp = props.onclick;
            }

            function linkRedirection(event) {
                event.preventDefault();
                // If no Router have been initialized, the linkRedirection can't be.
                if (!routingEnabled) throw Error(missingRouterErrorMessage);

                onClickProp(event);
                // Redirection ( if the path is the same as the actual
                // so we don't push into history but replace this one with a new)

                if (StateSystem.getState(ROUTING_CURRENT_PATH_NAME) === href) {
                    window.history.replaceState({
                        ...props?.state, FeelPath: href
                    }, null, windowLocationPathOrigin);
                } else {
                    window.history.pushState({
                        ...props?.state, FeelPath: href
                    }, null, windowLocationPathOrigin);
                    StateSystem.dispatch(ROUTING_CURRENT_PATH_NAME, href);
                }
            }

            const linkElement = createElement("a", {
                href,
                ...props,
                onclick: linkRedirection
            }, childrens);
            
            return linkElement;
        }

        return { Router, Link };
    })()
    //#endregion

    /**
     * @description Add a stylesheet to head
     * @param {String} path 
     */
    const addStylesheet = function(path) {
        const style = document.createElement("link")
        style.href = path;
        style.rel = "stylesheet";
        document.head.appendChild(style);
    }

    /**
     * @description Fonction de création d 'element HTML
     * @param {HTMLElement} type 
     * @param {HTMLElement} props 
     * @param {HTMLElement[]} childrens 
     */
    function createElement(type, props, childrens = []) {
        if (!type) throw Error("Need to provide the element type").stack;
        const element = document.createElement(type);
        if (!props) props = {};
        
        for (const [prop, propValue] of Object.entries(props)) {
            if (prop !== "style") {
                element[prop] = propValue;
            } else {
                for (const [styleProperty, styleValue] of Object.entries(propValue)) {
                    let v = styleValue;
                    if (!Number.isNaN(v)) v = `${v}px`;
                    element.style[styleProperty] = v;
                }
            }
        }
        if (childrens) {
            if (!Array.isArray(childrens)) childrens = [childrens]
            element.append(...childrens);
        }
        return element;
    }

    return methodsExport();
})()
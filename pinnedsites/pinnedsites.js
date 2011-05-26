/*!
* Pinned Sites
* https://github.com/jamie-altizer/PinnedSites
*
* Copyright 2011, Jamie Altizer
* Licensed under the MIT
* https://github.com/jamie-altizer/PinnedSites/blob/master/LICENSE
*
* Date: Tues May 24 8:30:00 2011 -0500
*
* Version: 0.2.0.0
*/

Array.prototype.find = function (property, value) {
    for (var item = 0; item < this.length; ++item) {
        if (this[item][property] == value) {
			return this[item];
		}
    }
	return undefined;
};

//If something does not seem to be functioning, please check the Debugging Console of your browser. Some known behavior or issues
//  will be output there.
Pinned = window.Pinned = function () {
    function hasFuncitonality() {
        return typeof window.external.msAddSiteMode != 'undefined';
    }
    function writeToConsole(text) {
        if (typeof console != 'undefined' &&
            typeof console.log != 'undefined') {
            console.log(text);
        }
    }

    //Window Unload cleanup
    var unloadCallbacks = [];
    function windowUnload() {
        for (var item = 0; item < unloadCallbacks.length; ++item) {
            unloadCallbacks[item]();
        }
    }
    window.onunload = windowUnload;

    function createMetaElement(attributes) {
        var element = document.createElement('meta');

        for (var item = 0; item < attributes.length; ++item) {
            element.setAttribute(attributes[item].name, attributes[item].value);
        }

        return element;
    }

    function addElementToHead(element) {
        var head = document.getElementsByTagName('head');
        if (head != undefined) {
            head[0].appendChild(element);
        }
    }

    return {

        isPinned: function () {
            if (hasFuncitonality()) {
                return window.external.msIsSiteMode();
            }
            return false;
        } (),

        init: function (options) {
            if (hasFuncitonality()) {
                if (options == undefined) {
                    options = {};
                }

                if (options.name == undefined) {
                    options.name = document.title;
                }

                addElementToHead(createMetaElement([
                    { 'name': 'name', 'value': 'application-name' },
                    { 'name': 'content', 'value': options.name}]));

                if (options.tooltip == undefined) {
                    options.tooltip = 'Visit ' + document.title;
                }

                addElementToHead(createMetaElement([
                    { 'name': 'name', 'value': 'msapplication-tooltip' },
                    { 'name': 'content', 'value': options.tooltip}]));

                if (options.startUrl == undefined) {
                    options.startUrl = document.location.href;
                }

                addElementToHead(createMetaElement([
                    { 'name': 'name', 'value': 'msapplication-starturl' },
                    { 'name': 'content', 'value': options.startUrl}]));

                if (options.windowSize != undefined) {
					addElementToHead(createMetaElement([
						{ 'name': 'name', 'value': 'msapplication-window' },
						{ 'name': 'content', 'value': options.windowSize}]));
                }


                if (options.color != undefined) {
					addElementToHead(createMetaElement([
						{ 'name': 'name', 'value': 'msapplication-navbutton-color' },
						{ 'name': 'content', 'value': options.color}]));
                }
			}
        },

        addToStartMenu: function () {
            if (hasFuncitonality()) {
                window.external.msAddSiteMode();
            }
        },

        Tasks: function () {
            function createTask(task) {
				if (task.icon == undefined || task.icon.length == 0) {
					task.icon = task.action + '/favicon.ico';
				}
				
                return createMetaElement([
                        { 'name': 'name', 'value': 'msapplication-task' },
                        { 'name': 'content', 'value': 'name=' + task.name +
                            ';action-uri=' + task.action + ';icon-uri=' + task.icon
                        }
                    ]);
            }

            return {

                build: function (tasks) {
                    if (hasFuncitonality()) {
                        for (var item = 0; item < tasks.length; ++item) {
                            addElementToHead(createTask(tasks[item]));
                        }
                    }
                }

            };
        } (),

        Taskbar: function () {
            function flash() {
                window.external.msSiteModeActivate();
            }

            return {
                flash: function (intervalInSeconds) {
                    if (hasFuncitonality()) {
                        if (intervalInSeconds == undefined) {
                            intervalInSeconds = 3;
                        }

                        setInterval(flash, 1000 * intervalInSeconds);
                    }
                }
            };
        } (),

        Overlay: function () {
            var blinkiconUri = '';
            var blinkDuration = 0;
			var wroteLargeIconMsg = false;
			
            function add(iconUri) {
                if (hasFuncitonality()) {
                    if (!wroteLargeIconMsg) {
						writeToConsole('If your icon does not showup, this is because the taskbar ' +
                            'has to be set to display "large icons"');
						wroteLargeIconMsg = true;
					}
					
                    window.external.msSiteModeSetIconOverlay(iconUri);

                    //Add clear() to window.unload callback list
                    unloadCallbacks.push(clear);
                }

                if (blinkDuration != 0) {
                    setInterval(clear, 1000 * blinkDuration);
                }
            }

            function clear() {
                if (hasFuncitonality()) {
                    window.external.msSiteModeClearIconOverlay();
                }
            }

            return {
                add: function (iconUri) {
                    if (iconUri == undefined) {
                        iconUri = blinkiconUri;
                    }

                    add(iconUri);
                },

                clear: function () {
                    clear();
                },

                removeAfter: function (iconUri, durationInSeconds) {
                    if (hasFuncitonality()) {
                        add(iconUri);
                    }

                    if (durationInSeconds == undefined) {
                        durationInSeconds = 5;
                    }

                    setInterval(this.clear, 1000 * durationInSeconds);
                },

                blink: function (iconUri, startTimeInSeconds, durationInSeconds) {
                    if (hasFuncitonality()) {
                        if (startTimeInSeconds == undefined) {
                            startTimeInSeconds = 5;
                        }
                        blinkiconUri = iconUri;

                        if (durationInSeconds == undefined) {
                            durationInSeconds = 3;
                        }
                        blinkDuration = durationInSeconds;

                        setInterval(this.add, 1000 * startTimeInSeconds);
                    }
                }
            };
        } (),

        Jumplist: function () {
            var listMax = 20;           //Maximum Windows supports at this time
            var listPsuedoMax = 10;     //Number of items to suggest limiting the JumpList to

            function sanityCheck(list) {
                if (list.length > listMax - 1) {
                    writeToConsole('The JumpList have a maximum total of ' + listMax + ' viewable items, ' +
                            'typically users only have their environment setup to view only ' + listPsuedoMax + '.');
                } else if (list.length > listPsuedoMax - 1) {
                    writeToConsole('The JumpList should stay at ' + listPsuedoMax + ' items or less, typically ' +
                            'users only have their environment setup to view only 10.');
                }
            }

            return {

                build: function (name, items) {
                    if (hasFuncitonality()) {

                        window.external.msSiteModeCreateJumplist(name);

                        sanityCheck(items);

                        for (var item = 0; item < items.length; ++item) {
							var jump = items[item];
							if (jump.icon == undefined || jump.icon.length == 0) {
								jump.icon = jump.action + '/favicon.ico';
							}
                            window.external.msSiteModeAddJumpListItem(jump.name,
                                    jump.action,
                                    jump.icon);
                        }

                        window.external.msSiteModeShowJumplist();
                    }
                },

                clear: function () {
                    if (hasFuncitonality()) {
                        window.external.msSiteModeClearJumplist();
                    }
                }

            };
        } (),

        ThumbBar: function () {
            var _buttons = [];
            var buttonMax = 7;

            function bindEvent(el, eventName, eventHandler) {
                if (el.addEventListener) {
                    el.addEventListener(eventName, eventHandler, false);
                }
                else if (el.attachEvent) {
                    el.attachEvent('on' + eventName, eventHandler);
                }
            }
            function buttonListener(e) {
				var button = _buttons.find('id', e.buttonID);
				if (button != undefined) {
					if (button.styles == undefined ) {
						button.styles = [];
					}
					button.callback(e.buttonID, button.styles);
					return;
				}
            }

            function addButton(button) {
                if (hasFuncitonality()) {
                    if (_buttons.length >= buttonMax - 1) {
                        writeToConsole('The ThumbBar should not have more than ' + buttonMax + ' buttons.');
                        return;
                    }

                    var buttonId = window.external.msSiteModeAddThumbBarButton(button.icon, button.tooltip);

                    _buttons.push({ 'id': buttonId, 'callback': button.callback });
                }
            }

			function addStyleButton(button) {
                if (hasFuncitonality()) {
                    if (_buttons.length >= buttonMax - 1) {
                        writeToConsole('The ThumbBar should not have more than ' + buttonMax + ' buttons.');
                        return;
                    }
					
					var buttonId = window.external.msSiteModeAddThumbBarButton('', '');
					var styles = [];

					for(var item = 0; item < button.styles.length; ++item) {					
						var styleId = window.external.msSiteModeAddButtonStyle(buttonId, 
							button.styles[item].icon, 
							button.styles[item].tooltip);
						
						var style = {'id': styleId, 'tooltip': button.styles[item].tooltip };
						if (button.styles[item].current == true) {
							style.current = true;
						} else {
							style.current = false;
						}
						
						styles.push(style);
					}
				
					_buttons.push({ 'id': buttonId, 'callback': button.callback, 'styles': styles });
                }
            }

            function updateThumbBar() {
                for (var item = 0; item < _buttons.length; ++item) {
					var curButton = _buttons[item];
					
					if (curButton.styles != undefined) {
						for(var s = 0; s < curButton.styles.length; ++s) {
							var style = curButton.styles[s];
							if (style.current != undefined && style.current === true) {
								window.external.msSiteModeShowButtonStyle(curButton.id, style.id);
							}
						}
					} else {
						window.external.msSiteModeUpdateThumbBarButton(curButton.id, true, true);
					}
                }
            }

            function hideButton(buttonId) {
                window.external.msSiteModeUpdateThumbBarButton(buttonId, false, false);
            }

            return {
				
                build: function (buttons, keepOnUnload) {
                    if (hasFuncitonality()) {
                        if (keepOnUnload == undefined || keepOnUnload !== true) {
                            //Set unload to cleanup resources only valid to mysite
                            unloadCallbacks.push(this.hideAll);
                        }

                        //Had an issue where IE9 would not support addEventListener
                        bindEvent(document, 'msthumbnailclick', buttonListener);

                        for (var item = 0; item < buttons.length; ++item) {
                            var button = buttons[item];
							
							if (button.styles == undefined) {
								addButton(button);
							} else {
								addStyleButton(button);
							}
                        }

                        window.external.msSiteModeShowThumbBar();
                        updateThumbBar();
                    }
                },
				
                hideAll: function () {
                    for (var item = 0; item < _buttons.length; ++item) {
                        hideButton(_buttons[item].id);
                    }
                },
				
				changeStyle: function (buttonId, styleId) {
					var styles = _buttons.find('id', buttonId).styles;
					for(var s = 0; s < styles.length; ++s) {
						styles[s].current = false;
						if(styles[s].id == styleId) {
							styles[s].current = true;
						}
					}
					
					window.external.msSiteModeShowButtonStyle(buttonId, styleId);
				}

				
            };
        } ()
    };
} ();

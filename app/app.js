steal
	.plugins('steal/less')
	.then(function($){
		//steal.less('app')
	})
	.plugins('jquery/controller/subscribe','funcunit/syn', 
		'funcit/highlight', 'mxui/fittable', 'jquery/dom/form_params', 
		'jquery/controller/subscribe')
	.then(function($){
	var getKey =  function( code ) {
		for(var key in Syn.keycodes){
			if(Syn.keycodes[key] == code){
				return key
			}
		}
	}
	/**
	 * addDrag, addChar, addClick
	 */
	$.Controller('Funcit.App',{
		defaults : {
			text : "Enter the starting page's url"
		}
	},
	{
		init : function(){
			this.downKeys = [];
			this.current = [];
			this.justKey = true;
			this.mousemoves =0;
			this.hoveredEl = null;
			this.record = true;
			
			$(document).keydown(this.callback('onDocumentKeydown'))
			
			// if the a test is appended to the URL, load it and skip the form
			// http://localhost:8000/funcit/funcit.html?url=/funcunit/syn/demo.html
			var pageURLMatch = location.search && location.search.match(/\?url\=(.*)/),
				pageURL = (pageURLMatch && pageURLMatch[1]) || Funcit.url;
			if(pageURL){
				this.loadIframe(pageURL);
				return;
			}
			
			this.element.html("<form action=''><input type='text' name='url'/></form>")
				.find('input').val(this.options.text);
			this.element.addClass('loading');
			
		},
		"input focusin" : function(el){
			if(el.val() == this.options.text){
				el.val("")
			}
		},
		"input focusout" : function(el){
			if(el.val() === ""){
				el.val(this.options.text)
			}
		},
		"form submit" : function(){
			var url = this.find('[name=url]').val();
			this.element.html("");
			this.loadIframe(url);
		},
		loadIframe: function(url){
			//now create an iframe, bind on it, and start sending everyone else messages
			//we might need to put a mask over it if people are stopPropagation
			$("<iframe src='"+url+"'></iframe>").load(this.callback('loaded', url)).appendTo(this.element)
		},
		loaded : function(url, ev){
			var controller = this;
			this.element.removeClass('loading')
			//listen to everything on this guy ...
			this.element.trigger("addEvent",["open",url, ev.target])
			$(ev.target.contentWindow.document)
				.keydown(this.callback('onKeydown'))
				.keyup(this.callback('onKeyup'))
				.mousedown(this.callback('onMousedown'))
				.mousemove(this.callback('onMousemove'))
				.mouseup(this.callback('onMouseup'))
				.change(this.callback('onChange'))
				.scroll(this.callback('onScroll'))
				.find('*').scroll(this.callback('onScroll'))
//				.bind("DOMAttrModified",this.callback('onModified'))
//				.bind("DOMNodeInserted",function(ev){
//					//console.log(ev.originalEvent.attrName, ev.target, ev.originalEvent.newValue)
//				})
//				.bind("DOMNodeRemoved",function(ev){
//					//console.log(ev.originalEvent.attrName, ev.target, ev.originalEvent.newValue)
//				})
		},
		onModified: function(ev){
			var newVal = ev.originalEvent.newValue,
				prop = ev.originalEvent.attrName;
			//console.log(prop, newVal, ev.target);
			if(prop == 'style'){
				var attrArr = newVal.split(":"),
					attr = attrArr[0],
					val = attrArr[1];
				if(attr == 'display'){
					if (/block/.test(val)) {
						this.publish('funcit.suggestion',{
							el: ev.target,
							type: 'visible'
						})
					}
					else if (/none/.test(val)) {
						this.publish('funcit.suggestion',{
							el: ev.target,
							type: 'invisible'
						})
					}
				}
			}
		},
		onMousemove : function(e){
			if(this.record_mouse){
				this.element.trigger("addEvent", ['mousemove', {x: e.pageX, y: e.pageY}])
			}
			this.mousemoves++;
		},
		onKeydown : function(ev){
			this.stopMouseRecording(ev);
			var key = getKey(ev.keyCode);
			if(this.keytarget != ev.target){
				this.current = [];
				this.keytarget = ev.target;
			}
			if($.inArray(key, this.downKeys) == -1){
				this.downKeys.push(key);
				//h.showChar(key, ev.target);
				this.element.trigger("addEvent",["char",key, ev.target])
			}
		},
		onKeyup : function(ev){
			var key = getKey(ev.keyCode),
				self = this;
			if(Syn.key.isSpecial(ev.keyCode)){
				this.element.trigger("addEvent",["char",key+"-up", ev.target])
			}
			
			var location = $.inArray(key, this.downKeys);
			this.downKeys.splice(location,1);
			this.justKey = true;
			setTimeout(function(){
				self.justKey = false;
			},20)
		},
		onMousedown : function(ev){
			this.mousedownEl = ev.target;
			this.mousemoves = 0
			this.lastX = ev.pageX
			this.lastY = ev.pageY;
		},
		
		onMouseup : function(ev){
			if(/option/i.test(ev.target.nodeName)){

			}else if(ev.which == 3){
				this.element.trigger("addEvent", ['rightClick', undefined, ev.target]);
			}else if(!this.mousemoves || (this.lastX == ev.pageX && this.lastY == ev.pageY)){
				if(this.clickTimeout){
					clearTimeout(this.clickTimeout);
					delete this.clickTimeout;
					this.element.trigger("addEvent",["doubleClick",undefined, ev.target]);
				} else {
					var controller = this;
					this.clickTimeout = setTimeout(function(){
						controller.element.trigger("addEvent",["click",undefined, ev.target]);
						delete controller.clickTimeout;
					}, 200);
				}
			}else if(this.mousemoves > 2 && this.mousedownEl){
				this.element.trigger("addEvent",["drag",{clientX : ev.clientX,
					clientY: ev.clientY}, this.mousedownEl])
			}
			
			this.mousedownEl = null;
			this.mousemoves = 0;
			this.lastY = this.lastX = null;
		},
		onChange : function(ev){
			if(!this.justKey && ev.target.nodeName.toLowerCase() == "select"){

				var el = $("option:eq("+ev.target.selectedIndex+")", ev.target);
				this.element.trigger("addEvent",["click",undefined, el[0]])
			}
		},
		onScroll: function(ev){
			if(this.record_scroll){
				this.element.trigger("addEvent",["scroll", {x: 0, y: 0}, ev.target]);
			}
		},
		onDocumentKeydown: function(ev){
			this.stopMouseOrScrollRecording(ev);
		},
		stopMouseOrScrollRecording: function(ev){
			if(ev.keyCode == 83 && this.record_mouse){
				this.publish('funcit.record_mouse', {recording_mouse: false});
				Funcit.Tooltip.close();
			}
			if(ev.keyCode == 83 && this.record_scroll){
				this.publish('funcit.record_scroll', {recording_mouse: false});
				Funcit.Tooltip.close();
			}
		},
		'funcit.record_scroll subscribe': function(called, params){
			if(params.recording_scroll) {
				this.record_scroll = true;
			} else {
				this.record_scroll = false;
			}
		},
		'funcit.record_mouse subscribe': function(called, params){
			if(params.recording_mouse) {
				this.record_mouse = true;
			} else {
				this.record_mouse = false;
			}
		},
	})
	
});
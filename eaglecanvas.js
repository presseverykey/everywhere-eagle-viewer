var p = function(o){ console.log(o) }
// -----------------------
// --- ENUMS, DEFAULTS ---
// -----------------------

EagleCanvas.LayerId = {
	'BOTTOM_COPPER' : 1,
	'BOTTOM_SILKSCREEN' : 2,
	'BOTTOM_DOCUMENTATION' : 3,
	'DIM_BOARD' : 4,
	'TOP_COPPER' : 5,
	'TOP_SILKSCREEN' : 6,
	'TOP_DOCUMENTATION' : 7,
	'VIAS' : 8,
	'OUTLINE' : 9
}

EagleCanvas.LARGE_NUMBER = 99999;

EagleCanvas.prototype.scale = 25;
EagleCanvas.prototype.minScale = 2.5;
EagleCanvas.prototype.maxScale = 250;
EagleCanvas.prototype.minLineWidth = 0.05;
EagleCanvas.prototype.boardFlipped = false;
EagleCanvas.prototype.dimBoardAlpha = 0.7;

// -------------------
// --- CONSTRUCTOR ---
// -------------------

function EagleCanvas(canvasId) {
	this.canvasId = canvasId;
	
	this.visibleLayers = {};
	this.visibleLayers[EagleCanvas.LayerId.BOTTOM_COPPER]        = true;
	this.visibleLayers[EagleCanvas.LayerId.BOTTOM_SILKSCREEN]    = true;
	this.visibleLayers[EagleCanvas.LayerId.BOTTOM_DOCUMENTATION] = true;
	this.visibleLayers[EagleCanvas.LayerId.DIM_BOARD]            = true;
	this.visibleLayers[EagleCanvas.LayerId.TOP_COPPER]           = true;
	this.visibleLayers[EagleCanvas.LayerId.TOP_SILKSCREEN]       = true;
	this.visibleLayers[EagleCanvas.LayerId.TOP_DOCUMENTATION]    = true;
	this.visibleLayers[EagleCanvas.LayerId.VIAS]                 = true;
	this.visibleLayers[EagleCanvas.LayerId.OUTLINE]              = true;

	this.renderLayerOrder = [];
	this.renderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_DOCUMENTATION);
	this.renderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_SILKSCREEN);
	this.renderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_COPPER);
	this.renderLayerOrder.push(EagleCanvas.LayerId.DIM_BOARD);
	this.renderLayerOrder.push(EagleCanvas.LayerId.OUTLINE);
	this.renderLayerOrder.push(EagleCanvas.LayerId.TOP_COPPER);
	this.renderLayerOrder.push(EagleCanvas.LayerId.VIAS);
	this.renderLayerOrder.push(EagleCanvas.LayerId.TOP_SILKSCREEN);
	this.renderLayerOrder.push(EagleCanvas.LayerId.TOP_DOCUMENTATION);

	this.reverseRenderLayerOrder = [];
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.TOP_DOCUMENTATION);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.TOP_SILKSCREEN);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.TOP_COPPER);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.DIM_BOARD);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.OUTLINE);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_COPPER);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.VIAS);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_SILKSCREEN);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_DOCUMENTATION);

	this.layerRenderFunctions = {};
	
	this.layerRenderFunctions[EagleCanvas.LayerId.BOTTOM_COPPER] = function(that,ctx) {
		that.drawSignalWires(that.eagleLayersByName['Bottom'],ctx);
		that.drawElements(that.eagleLayersByName['Bottom'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.BOTTOM_SILKSCREEN] = function(that,ctx) {
		that.drawElements(that.eagleLayersByName['bNames'],ctx);
		that.drawElements(that.eagleLayersByName['bValues'],ctx);
		that.drawElements(that.eagleLayersByName['bPlace'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.BOTTOM_DOCUMENTATION] = function(that,ctx) {
		that.drawElements(that.eagleLayersByName['bKeepout'],ctx);
		that.drawElements(that.eagleLayersByName['bDocu'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.TOP_COPPER] = function(that,ctx) {
		that.drawSignalWires(that.eagleLayersByName['Top'],ctx);
		that.drawElements   (that.eagleLayersByName['Top'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.TOP_SILKSCREEN] = function(that,ctx) {
		that.drawElements(that.eagleLayersByName['tNames'],ctx);
		that.drawElements(that.eagleLayersByName['tValues'],ctx);
		that.drawElements(that.eagleLayersByName['tPlace'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.TOP_DOCUMENTATION] = function(that,ctx) {
		that.drawElements(that.eagleLayersByName['tKeepout'],ctx);
		that.drawElements(that.eagleLayersByName['tDocu'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.DIM_BOARD] = function(that,ctx) {
		that.dimCanvas(ctx,that.dimBoardAlpha);
	}	

	this.layerRenderFunctions[EagleCanvas.LayerId.VIAS] = function(that,ctx) {
		that.drawSignalVias('1-16',ctx, '#0b0');
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.OUTLINE] = function(that,ctx) {
		that.drawPlainWires(that.eagleLayersByName['Dimension'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.BOTTOM_COPPER] = function(that,ctx) {
		that.drawSignalWires(that.eagleLayersByName['Bottom'],ctx);
		that.drawElements   (that.eagleLayersByName['Bottom'],ctx);
	}

	this.hitTestFunctions = {};
	
	this.hitTestFunctions[EagleCanvas.LayerId.BOTTOM_COPPER] = function(that,x,y) {
		return that.hitTestElements(that.eagleLayersByName['Bottom'],x,y)
			|| that.hitTestSignals(that.eagleLayersByName['Bottom'],x,y);
	}

	this.hitTestFunctions[EagleCanvas.LayerId.TOP_COPPER] = function(that,x,y) {
		return that.hitTestElements(that.eagleLayersByName['Top'],x,y)
			|| that.hitTestSignals(that.eagleLayersByName['Top'],x,y);
	}


}


// -------------------------
// --- GENERIC ACCESSORS ---
// -------------------------

/** sets an element id to which the drawing should be initially scaled */
EagleCanvas.prototype.setScaleToFit = function(elementId) {
	this.scaleToFitId = elementId;
}

EagleCanvas.prototype.getScale = function(scale) {
	return this.scale;
}

/** sets the scale factor, triggers resizing and redrawing */
EagleCanvas.prototype.setScale = function(scale) {
	this.scale = scale;
	var canvas = document.getElementById(this.canvasId);
	canvas.width = scale * this.nativeSize[0];
	canvas.height = scale * this.nativeSize[1];
	this.draw();
}


/** Returns whether a given layer is visible or not */
EagleCanvas.prototype.isLayerVisible = function (layerId) {
	return this.visibleLayers[layerId] ? true : false;
}

/** Turns a layer on or off */
EagleCanvas.prototype.setLayerVisible = function (layerId, on) {
	if (this.isLayerVisible(layerId) == on) { return; }
	this.visibleLayers[layerId] = on ? true : false;
	this.draw();
}

/** Returns whether the board is flipped (bottom at fromt) or not */
EagleCanvas.prototype.isBoardFlipped = function () {
	return this.boardFlipped;
}

/** Turns top or bottom to the front */
EagleCanvas.prototype.setBoardFlipped = function (flipped) {
	if (this.boardFlipped == flipped) { return; }
	this.boardFlipped = flipped ? true : false;
	this.draw();
}

EagleCanvas.prototype.setHighlightedItem = function(item) {
	this.highlightedItem = item;
	this.draw();
}

// ---------------
// --- LOADING ---
// ---------------

EagleCanvas.prototype.loadURL = function(url, cb) {
	this.url = url;
	var request = new XMLHttpRequest(),
			self = this;
	request.open('GET', this.url, true);
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
        	self.loadText(request.responseText);
					cb(self)
	    }
	};
	request.send(null);
};

EagleCanvas.prototype.loadText = function(text) {
	this.text = text;
	var parser = new DOMParser();
	this.boardXML = parser.parseFromString(this.text,"text/xml");
	this.parse();
	this.nativeBounds = this.calculateBounds();
	this.nativeSize   = [this.nativeBounds[2]-this.nativeBounds[0],this.nativeBounds[3]-this.nativeBounds[1]];
	this.scaleToFit();
}


// ---------------
// --- PARSING ---
// ---------------

EagleCanvas.prototype.parse = function() {
  // store by eagle name
	this.eagleLayersByName = {};
  // store by eagle number
	this.layersByNumber = {};

	var layers = this.boardXML.getElementsByTagName('layer');
	for (var layerIdx = 0; layerIdx < layers.length; layerIdx++) {
		var layerDict = this.parseLayer( layers[layerIdx] );
		this.eagleLayersByName[layerDict.name] = layerDict;
		this.layersByNumber[layerDict.number]  = layerDict;
	}

	this.elements = {};
	var elements = this.boardXML.getElementsByTagName('element');
	for (var elementIdx = 0; elementIdx < elements.length; elementIdx++) {
		var elemDict = this.parseElement( elements[elementIdx] )
		this.elements[elemDict.name] = elemDict;
	}

	this.signalItems = {};
	//hashmap signal name -> hashmap layer number -> hashmap 'wires'->wires array, 'vias'->vias array
	var signals = this.boardXML.getElementsByTagName('signal');
	for (var sigIdx = 0; sigIdx < signals.length; sigIdx++) {
		var signal = signals[sigIdx];
		var name = signal.getAttribute('name');
		var signalLayers = {};
		this.signalItems[name] = signalLayers;

		var wires = signal.getElementsByTagName('wire');
		for (var wireIdx = 0; wireIdx < wires.length; wireIdx++) {
			var wireDict = this.parseWire( wires[wireIdx] );
			var layer = wireDict.layer;
			if (!(signalLayers[layer])) signalLayers[layer] = {};
			var layerItems = signalLayers[layer];
			if (!(layerItems['wires'])) layerItems['wires'] = [];
			var layerWires = layerItems['wires'];
			layerWires.push(wireDict);
		}

		var vias = signal.getElementsByTagName('via');
		for (var viaIdx = 0; viaIdx < vias.length; viaIdx++) {
			var viaDict = this.parseVia(vias[viaIdx]);
			var layers = viaDict.layers;
			if (!(signalLayers[layers])) signalLayers[layers] = {};
			var layerItems = signalLayers[layers];
			if (!(layerItems['vias'])) layerItems['vias'] = [];
			var layerVias = layerItems['vias'];
			layerVias.push(viaDict);
		}

		var contacts = signal.getElementsByTagName('contactref');
		for (var contactIdx = 0; contactIdx < contacts.length; contactIdx++) {
			var contact = contacts[contactIdx];
			var elemName = contact.getAttribute('element');
			var padName = contact.getAttribute('pad');
			var elem = this.elements[elemName];
			if (elem) elem.padSignals[padName] = name;
		}
	}
	
	this.packagesByName = {};
	var packages = this.boardXML.getElementsByTagName('package');
	for (var packageIdx = 0; packageIdx < packages.length; packageIdx++) {
		var pkg = packages[packageIdx];
		var packageName = pkg.getAttribute('name');

		var packageSmds = [];
		var smds = pkg.getElementsByTagName('smd');
		for (var smdIdx = 0; smdIdx < smds.length; smdIdx++) {
			var smd = smds[smdIdx];
			packageSmds.push(this.parseSmd(smd));
		}

		var packageWires = [];
		var bbox = [EagleCanvas.LARGE_NUMBER,EagleCanvas.LARGE_NUMBER,-EagleCanvas.LARGE_NUMBER,-EagleCanvas.LARGE_NUMBER];
		var wires = pkg.getElementsByTagName('wire');
		for (var wireIdx = 0; wireIdx < wires.length; wireIdx++) {
			var wire = wires[wireIdx];
			var wireDict = this.parseWire(wire);
			if (wireDict.x1 < bbox[0]) { bbox[0] = wireDict.x1; }
			if (wireDict.x1 > bbox[2]) { bbox[2] = wireDict.x1; }
			if (wireDict.y1 < bbox[1]) { bbox[1] = wireDict.y1; }
			if (wireDict.y1 > bbox[3]) { bbox[3] = wireDict.y1; }
			if (wireDict.x2 < bbox[0]) { bbox[0] = wireDict.x2; }
			if (wireDict.x2 > bbox[2]) { bbox[2] = wireDict.x2; }
			if (wireDict.y2 < bbox[1]) { bbox[1] = wireDict.y2; }
			if (wireDict.y2 > bbox[3]) { bbox[3] = wireDict.y2; }
			packageWires.push(wireDict);
		}
		if ((bbox[0] >= bbox[2]) || (bbox[1] >= bbox[3])) { bbox = null; }
		var packageTexts = [],
		    texts        = pkg.getElementsByTagName('text');
		for (var textIdx = 0; textIdx < texts.length; textIdx++) {
			var text = texts[textIdx];
			packageTexts.push(this.parseText(text));
		}


		var packageDict = {'smds':packageSmds, 'wires':packageWires, 'texts':packageTexts, 'bbox':bbox};
		this.packagesByName[packageName] = packageDict;
	}

	this.plainWires = {};
	var plains = this.boardXML.getElementsByTagName('plain');	//Usually only one
	for (var plainIdx = 0; plainIdx < plains.length; plainIdx++) {
		var plain = plains[plainIdx],
		    wires = plain.getElementsByTagName('wire');
		for (var wireIdx = 0; wireIdx < wires.length; wireIdx++) {
			var wire = wires[wireIdx],
			    wireDict = this.parseWire(wire),
			    layer = wireDict.layer;
			if (!this.plainWires[layer]) this.plainWires[layer] = [];
			this.plainWires[layer].push(wireDict);
		}
	}
}

EagleCanvas.prototype.parseSmd = function(smd) {
	var smdX  = parseFloat(smd.getAttribute('x')),
	    smdY  = parseFloat(smd.getAttribute('y')),
	    smdDX = parseFloat(smd.getAttribute('dx')),
	    smdDY = parseFloat(smd.getAttribute('dy'));

	return {'x1'   : smdX-0.5*smdDX,
	        'y1'   : smdY-0.5*smdDY,
	        'x2'   : smdX+0.5*smdDX,
	        'y2'   : smdY+0.5*smdDY,
	        'name' : smd.getAttribute('name'),
	        'layer': smd.getAttribute('layer')};
}

EagleCanvas.prototype.parseVia = function(via) {
	return {'x':parseFloat(via.getAttribute('x')), 
	        'y':parseFloat(via.getAttribute('y')), 
 	        'drill':parseFloat(via.getAttribute('drill')), 
	        'layers':via.getAttribute('extent')};
}

EagleCanvas.prototype.parseWire = function(wire) {
	var width = parseFloat(wire.getAttribute('width'));
	if (width <= 0.0) width = this.minLineWidth;

	return {'x1':parseFloat(wire.getAttribute('x1')),
        	'y1':parseFloat(wire.getAttribute('y1')),
        	'x2':parseFloat(wire.getAttribute('x2')),
        	'y2':parseFloat(wire.getAttribute('y2')),
        	'width':width,
        	'layer':parseInt(wire.getAttribute('layer'))};
}

EagleCanvas.prototype.parseText = function(text) {
	var content = text.textContent;
	if (!content) content = "";
	return {'x'      : parseFloat(text.getAttribute('x')),
	        'y'      : parseFloat(text.getAttribute('y')),
	        'size'   : parseFloat(text.getAttribute('size')),
	        'layer'  : parseInt(text.getAttribute('layer')),
	        'font'   : text.getAttribute('font'),
	        'content': content};
}

EagleCanvas.prototype.parseElement = function(elem) {
	var elemRot    = elem.getAttribute('rot') || "R0",
	    elemMatrix = this.matrixForRot(elemRot);
	
	var attribs = {},
	    elemAttribs = elem.getElementsByTagName('attribute');
	for (var attribIdx = 0; attribIdx < elemAttribs.length; attribIdx++) {

		var elemAttrib = elemAttribs[attribIdx],
		    attribDict = {},
		    name = elemAttrib.getAttribute('name');

		if (name) {
			attribDict.name = name;
			if (elemAttrib.getAttribute('x'))     { attribDict.x = parseFloat(elemAttrib.getAttribute('x')); }
			if (elemAttrib.getAttribute('y'))     { attribDict.y = parseFloat(elemAttrib.getAttribute('y')); }
			if (elemAttrib.getAttribute('size'))  { attribDict.size = parseFloat(elemAttrib.getAttribute('size')); }
			if (elemAttrib.getAttribute('layer')) { attribDict.layer = parseInt(elemAttrib.getAttribute('layer')); }
			attribDict.font = elemAttrib.getAttribute('font');

			var rot = elemAttrib.getAttribute('rot');
			if (!rot) { rot = "R0"; }
			attribDict.rot = rot;
			attribs[name] = attribDict;
		}
	}
	return {
		'pkg'   : elem.getAttribute('package'),
		'name'      : elem.getAttribute('name'),
		'value'     : elem.getAttribute('value'),
		'x'         : parseFloat(elem.getAttribute('x')),
		'y'         : parseFloat(elem.getAttribute('y')),
		'rot'       : elemRot,
		'matrix'    : elemMatrix,
		'mirror'    : elemRot.indexOf('M') == 0,
		'smashed'   : elem.getAttribute('smashed') && (elem.getAttribute('smashed').toUpperCase() == 'YES'),
		'attributes': attribs,
		'padSignals': {}			//to be filled later
	};
};

EagleCanvas.prototype.parseLayer = function(layer) {
	return {'name'  : layer.getAttribute('name'), 
	        'number': parseInt(layer.getAttribute('number')), 
	        'color' : parseInt(layer.getAttribute('color'))};
}

// ---------------
// --- DRAWING ---
// ---------------

EagleCanvas.prototype.draw = function() {
	var canvas = document.getElementById(this.canvasId),
	    ctx    = canvas.getContext('2d');

	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.save();
	
	ctx.transform(this.scale * (this.boardFlipped ? -1.0 : 1.0), 
	              0, 
								0, 
								-this.scale, 
								0, 
								ctx.canvas.height);
	ctx.translate( (this.boardFlipped ? -this.nativeBounds[2] : -(this.nativeBounds[0])),
	               -this.nativeBounds[1]);

	var layerOrder = this.boardFlipped ? this.reverseRenderLayerOrder : this.renderLayerOrder;
	for (var layerKey in layerOrder) {
		var layerId = layerOrder[layerKey];
		if (!this.visibleLayers[layerId]) { continue };
		this.layerRenderFunctions[layerId](this,ctx);
	}

	ctx.restore();
}

EagleCanvas.prototype.drawPlainWires = function(layer, ctx) {
	if (!layer) { return; }

	ctx.lineCap = 'round';
	ctx.strokeStyle = this.layerColor(layer.color);

	var layerWires = this.plainWires[layer.number] || [];
	layerWires.forEach(function(wire){
		ctx.beginPath();
		ctx.moveTo(wire.x1, wire.y1);
		ctx.lineTo(wire.x2, wire.y2);
		ctx.lineWidth = wire.width;
		ctx.stroke();
	})
}

EagleCanvas.prototype.drawSignalWires = function(layer, ctx) {
	if (!layer) { return; }
	var layerNumber = layer.number;

	ctx.lineCap = 'round';

	for (var signalKey in this.signalItems) {

		var highlight = (this.highlightedItem && (this.highlightedItem.type=='signal') && (this.highlightedItem.name==signalKey)); 
		var color = highlight ? this.highlightColor(layer.color) : this.layerColor(layer.color);
		ctx.strokeStyle = color;


		var signalLayers = this.signalItems[signalKey],
		    layerItems = signalLayers[layer.number];
		if (!layerItems) { continue; }
		var layerWires = layerItems['wires'] || [];
		layerWires.forEach(function(wire) {
			ctx.beginPath();
			ctx.moveTo(wire.x1, wire.y1);
			ctx.lineTo(wire.x2, wire.y2);
			ctx.lineWidth = wire.width;
			ctx.stroke();
		})
	}
}

EagleCanvas.prototype.drawSignalVias = function(layersName, ctx, color) {
	if (!layersName) return;

	ctx.strokeStyle = color;

	for (var signalKey in this.signalItems) {
		var signalLayers = this.signalItems[signalKey],
		    layerItems = signalLayers[layersName];
		if (!layerItems) {continue;}
		var layerVias = layerItems['vias'] || [];
		layerVias.forEach(function(via) {
			ctx.beginPath();
			ctx.arc(via.x, via.y, 0.75 * via.drill, 0, 2 * Math.PI, false);
			ctx.lineWidth = 0.5 * via.drill;
			ctx.stroke();
		})
	}
}

EagleCanvas.prototype.drawElements = function(layer, ctx) {
	if (!layer) return;

	for (var elemKey in this.elements) {
		var elem = this.elements[elemKey];
		
		var highlight = (this.highlightedItem && (this.highlightedItem.type=='element') && (this.highlightedItem.name==elem.name)); 
		var color     = highlight ? this.highlightColor(layer.color) : this.layerColor(layer.color);

		var pkg    = this.packagesByName[elem.pkg];
		var rotMat = elem.matrix;
			pkg.smds.forEach(function(smd) {
				var layerNum = smd.layer;
				if (elem.mirror) { layerNum = this.mirrorLayer(layerNum); }
				if (layer.number != layerNum) { return; }
				//Note that rotation might be not axis aligned, so we have do transform all corners
				var x1 = elem.x + rotMat[0]*smd.x1 + rotMat[1]*smd.y1,	//top left
						y1 = elem.y + rotMat[2]*smd.x1 + rotMat[3]*smd.y1,
						x2 = elem.x + rotMat[0]*smd.x2 + rotMat[1]*smd.y1,	//top right
						y2 = elem.y + rotMat[2]*smd.x2 + rotMat[3]*smd.y1,
						x3 = elem.x + rotMat[0]*smd.x2 + rotMat[1]*smd.y2,	//bottom right
						y3 = elem.y + rotMat[2]*smd.x2 + rotMat[3]*smd.y2,
						x4 = elem.x + rotMat[0]*smd.x1 + rotMat[1]*smd.y2,	//bottom left
						y4 = elem.y + rotMat[2]*smd.x1 + rotMat[3]*smd.y2;

				var padName = smd.name,
						signalName = elem.padSignals[padName],
						highlightPad = (this.highlightedItem && (this.highlightedItem.type=='signal') && (this.highlightedItem.name==signalName)); 

				ctx.fillStyle = highlightPad ? this.highlightColor(layer.color) : color;
				ctx.beginPath();
				ctx.moveTo(x1,y1);
				ctx.lineTo(x2,y2);
				ctx.lineTo(x3,y3);
				ctx.lineTo(x4,y4);
				ctx.closePath();
				ctx.fill();
			}, this)

		pkg.wires.forEach(function(wire) {
			var layerNum = wire.layer;
			if (elem.mirror) { layerNum = this.mirrorLayer(layerNum); }
			if (layer.number != layerNum) { return ; }
			var x1 = elem.x + rotMat[0]*wire.x1 + rotMat[1]*wire.y1,
			    y1 = elem.y + rotMat[2]*wire.x1 + rotMat[3]*wire.y1,
			    x2 = elem.x + rotMat[0]*wire.x2 + rotMat[1]*wire.y2,
			    y2 = elem.y + rotMat[2]*wire.x2 + rotMat[3]*wire.y2;
			ctx.beginPath();
			ctx.lineWidth = wire.width;
			ctx.moveTo(x1,y1);
			ctx.lineTo(x2,y2);
			ctx.strokeStyle = color;
			ctx.stroke();
		}, this)

		var smashed = elem.smashed,
		    textCollection = smashed ? elem.attributes : pkg.texts;	//smashed : use element attributes instead of package texts
		for (var textIdx in textCollection) {
			var text = textCollection[textIdx];
			var layerNum = text.layer;
			if ((!elem.smashed) && (elem.mirror)) { 
				layerNum = this.mirrorLayer(layerNum); 
			}
			if (layer.number != layerNum) { continue; }

			var content = smashed ? null : text.content,
			    attribName = smashed ? text.name : ((text.content.indexOf('>') == 0) ? text.content.substring(1) : null);
			if (attribName == "NAME")  { content = elem.name;  }
			if (attribName == "VALUE") { content = elem.value; }
			if (!content) { continue; }

			var x = smashed ? text.x : (elem.x + rotMat[0]*text.x + rotMat[1]*text.y),
			    y = smashed ? text.y : (elem.y + rotMat[2]*text.x + rotMat[3]*text.y),
			    rot = smashed ? text.rot : elem.rot,
			    size = text.size;

			//rotation from 90.1 to 270 causes Eagle to draw labels 180 degrees rotated with top right anchor point
			var degrees  = parseFloat(rot.substring((rot.indexOf('M')==0) ? 2 : 1)),
			    flipText = ((degrees > 90) && (degrees <=270)),
			    textRot  = this.matrixForRot(rot),
			    fontSize = 10;

			ctx.save();
			ctx.fillStyle = color;
			ctx.font = ''+fontSize+'pt vector';	//Use a regular font size - very small sizes seem to mess up spacing / kerning
			ctx.translate(x,y);
			ctx.transform(textRot[0],textRot[2],textRot[1],textRot[3],0,0);
			var scale = size / fontSize;
			ctx.scale(scale,-scale);
			if (flipText) {
				var metrics = ctx.measureText(content);
				ctx.translate(metrics.width,-fontSize);	//Height is not calculated - we'll use the font's 10pt size and hope it fits
				ctx.scale(-1,-1);
			}
			ctx.fillText(content, 0, 0);
			ctx.restore();
		}
	}
}

EagleCanvas.prototype.dimCanvas = function(ctx, alpha) {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillStyle = 'rgba(0,0,0,'+alpha+')'
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.restore();
};

// -------------------
// --- HIT TESTING ---
// -------------------

EagleCanvas.prototype.hitTest = function(x,y) {
	var canvas = document.getElementById(this.canvasId);
	//Translate screen to model coordinates
	x = x / this.scale;	
	y = (canvas.height - y) / this.scale;
	y += this.nativeBounds[1];
	x = this.boardFlipped ? (this.nativeBounds[2]-x) : (x+this.nativeBounds[0]);

	var layerOrder = (this.boardFlipped) ? this.reverseRenderLayerOrder : this.renderLayerOrder;
	for (var i = layerOrder.length-1; i >= 0; i--) {
		var layerId = layerOrder[i];
		if (!this.visibleLayers[layerId]) { continue; }
		var hitTestFunc = this.hitTestFunctions[layerId];
		if (!hitTestFunc) { continue; }
		var hit = hitTestFunc(this,x,y);
		if (hit) { return hit; }
	}
	return null;
}

EagleCanvas.prototype.hitTestElements = function(layer, x, y) {
	if (!layer) { return; }

	for (var elemKey in this.elements) {
		var elem = this.elements[elemKey],
		    pkg = this.packagesByName[elem.pkg];

		var rotMat = elem.matrix;

		var bbox = pkg.bbox;
		if (bbox) {
			var layerNum = this.eagleLayersByName['Top'].number;
			if (elem.mirror) layerNum = this.mirrorLayer(layerNum);
			if (layer.number != layerNum) continue;
			var x1 = elem.x + rotMat[0]*bbox[0] + rotMat[1]*bbox[1],	//top left
			    y1 = elem.y + rotMat[2]*bbox[0] + rotMat[3]*bbox[1],
			    x2 = elem.x + rotMat[0]*bbox[2] + rotMat[1]*bbox[1],	//top right
			    y2 = elem.y + rotMat[2]*bbox[2] + rotMat[3]*bbox[1],
			    x3 = elem.x + rotMat[0]*bbox[2] + rotMat[1]*bbox[3],	//bottom right
			    y3 = elem.y + rotMat[2]*bbox[2] + rotMat[3]*bbox[3],
			    x4 = elem.x + rotMat[0]*bbox[0] + rotMat[1]*bbox[3],	//bottom left
			    y4 = elem.y + rotMat[2]*bbox[0] + rotMat[3]*bbox[3];
			if (this.pointInRect(x,y,x1,y1,x2,y2,x3,y3,x4,y4)) {
				return {'type':'element','name':elem.name};
			}
		}

		for (var smdIdx in pkg.smds) {
			var smd = pkg.smds[smdIdx];
			var layerNum = smd.layer;
			if (elem.mirror) layerNum = this.mirrorLayer(layerNum);
			if (layer.number != layerNum) continue;
			var x1 = elem.x + rotMat[0]*smd.x1 + rotMat[1]*smd.y1,	//top left
			    y1 = elem.y + rotMat[2]*smd.x1 + rotMat[3]*smd.y1,
			    x2 = elem.x + rotMat[0]*smd.x2 + rotMat[1]*smd.y1,	//top right
			    y2 = elem.y + rotMat[2]*smd.x2 + rotMat[3]*smd.y1,
			    x3 = elem.x + rotMat[0]*smd.x2 + rotMat[1]*smd.y2,	//bottom right
			    y3 = elem.y + rotMat[2]*smd.x2 + rotMat[3]*smd.y2,
			    x4 = elem.x + rotMat[0]*smd.x1 + rotMat[1]*smd.y2,	//bottom left
			    y4 = elem.y + rotMat[2]*smd.x1 + rotMat[3]*smd.y2;
			if (this.pointInRect(x,y,x1,y1,x2,y2,x3,y3,x4,y4)) {
				var padName = smd.name;
				if (padName) {
					var signalName = elem.padSignals[padName];
					if (signalName) { return {'type':'signal','name':signalName}; }
				}
				return {'type':'element','name':elem.name};
			}
		}
	}
	return null;
}

EagleCanvas.prototype.hitTestSignals = function(layer, x, y) {
	for (var signalName in this.signalItems) {
		var signalLayers = this.signalItems[signalName];
		if (!signalLayers) { continue; }
		var layerItems = signalLayers[layer.number];
		if (!layerItems) { continue; }
		var layerWires = layerItems['wires'];
		if (!layerWires) { continue; }
		for (var wireIdx in layerWires) {
			var wire = layerWires[wireIdx],
			    x1 = wire.x1,
			    y1 = wire.y1,
			    x2 = wire.x2,
			    y2 = wire.y2,
			    width = wire.width;
			if (this.pointInLine(x,y,x1,y1,x2,y2,width)) { 
				return {'type':'signal','name':signalName}; 
			}
		}
	}
	return null;
}

EagleCanvas.prototype.pointInLine = function(x, y, x1, y1, x2, y2, width) {
	var width2 = width * width;

	if (((x-x1)*(x-x1)+(y-y1)*(y-y1)) < width2) { return true; }	//end 1 
	if (((x-x2)*(x-x2)+(y-y2)*(y-y2)) < width2) { return true; }	//end 2

	var length2 = (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1);
	if (length2 <= 0) { return false; }

	var s = ((y - y1) * (y2-y1) - (x - x1) * (x1-x2)) / length2;				// s = param of line p1..p2 (0..1)
	if ((s >= 0) && (s <= 1)) {													//between p1 and p2
		var px = x1 + s * (x2-x1),
		    py = y1 + s * (y2-y1);
		if (((x-px)*(x-px)+(y-py)*(y-py)) < width2) {
			return true;	//end 2
		}
	}
	return false;
}

EagleCanvas.prototype.pointInRect = function(x, y, x1, y1, x2, y2, x3, y3, x4, y4) {
	//p1..p4 in clockwise or counterclockwise order
	//Do four half-area tests
	return (((x-x1)*(x2-x1)+(y-y1)*(y2-y1)) >= 0)
		&& (((x-x1)*(x4-x1)+(y-y1)*(y4-y1)) >= 0)
		&& (((x-x3)*(x2-x3)+(y-y3)*(y2-y3)) >= 0)
		&& (((x-x3)*(x4-x3)+(y-y3)*(y4-y3)) >= 0);
}


// --------------------
// --- COMMON UTILS ---
// --------------------

EagleCanvas.prototype.colorPalette = [
	[  0,  0,  0], [ 35, 35,141], [ 35,141, 35], [ 35,141,141], [141, 35, 35], [141, 35,141], [141,141, 35], [141,141,141],
	[ 39, 39, 39], [  0,  0,180], [  0,180,  0], [  0,180,180], [180,  0,  0], [180,  0,180], [180,180,  0], [180,180,180]
];

EagleCanvas.prototype.layerColor = function(colorIdx) {
	var rgb = this.colorPalette[colorIdx];
	return 'rgb('+rgb[0]+','+rgb[1]+','+rgb[2]+')';
}

EagleCanvas.prototype.highlightColor = function(colorIdx) {
	var rgb = this.colorPalette[colorIdx];
	return 'rgb('+(rgb[0]+50)+','+(rgb[1]+50)+','+(rgb[2]+50)+')';
}

EagleCanvas.prototype.matrixForRot = function(rot) {
	var flipped      = (rot.indexOf('M') == 0),
	    degreeString = rot.substring(flipped ? 2 : 1),
	    degrees      = parseFloat(degreeString),
	    rad          = degrees * Math.PI / 180.0,
	    flipSign     = flipped ? -1 : 1,
	    matrix       = [flipSign * Math.cos(rad), flipSign * -Math.sin(rad), Math.sin(rad), Math.cos(rad)];
	return matrix;
}

EagleCanvas.prototype.mirrorLayer = function(layerIdx) {
	if (layerIdx == 1) { 
		return 16; 
	} else if (layerIdx == 16) {
		return 1;
	}
	var name   = this.layersByNumber[layerIdx].name,
	    prefix = name.substring(0,1);
	if (prefix == 't') {
		var mirrorName  = 'b' + name.substring(1),
		    mirrorLayer = this.eagleLayersByName[mirrorName];
		if (mirrorLayer) { 
			return mirrorLayer.number; 
		}
	} else if (prefix == 'b') {
		var mirrorName = 't' + name.substring(1),
		    mirrorLayer = this.eagleLayersByName[mirrorName];
		if (mirrorLayer) { 
			return mirrorLayer.number;
		}
	}
	return layerIdx;
}

EagleCanvas.prototype.calculateBounds = function() {
	var minX = EagleCanvas.LARGE_NUMBER,
	    minY = EagleCanvas.LARGE_NUMBER,
	    maxX = -EagleCanvas.LARGE_NUMBER,
	    maxY = -EagleCanvas.LARGE_NUMBER;
	//Plain elements
	for (var layerKey in this.plainWires) {
		var lines = this.plainWires[layerKey];
		for (var lineKey in lines) {
			var line = lines[lineKey],
			    x1 = line.x1,
			    x2 = line.x2,
			    y1 = line.y1,
			    y2 = line.y2,
			    width = line.width;
			if (x1-width < minX) { minX = x1-width; } if (x1+width > maxX) { maxX = x1+width; }
			if (x2-width < minX) { minX = x2-width; } if (x2+width > maxX) { maxX = x2+width; }
			if (y1-width < minY) { minY = y1-width; } if (y1+width > maxY) { maxY = y1+width; }
			if (y2-width < minY) { minY = y2-width; } if (y2+width > maxY) { maxY = y2+width; }
		}
	}

	//Elements
	for (var elemKey in this.elements) {
		var elem = this.elements[elemKey];
		var pkg = this.packagesByName[elem.pkg];
		var rotMat = elem.matrix;
		for (var smdIdx in pkg.smds) {
			var smd = pkg.smds[smdIdx],
			    x1 = elem.x + rotMat[0]*smd.x1 + rotMat[1]*smd.y1,
			    y1 = elem.y + rotMat[2]*smd.x1 + rotMat[3]*smd.y1,
			    x2 = elem.x + rotMat[0]*smd.x2 + rotMat[1]*smd.y2,
			    y2 = elem.y + rotMat[2]*smd.x2 + rotMat[3]*smd.y2;
			if (x1 < minX) { minX = x1; } if (x1 > maxX) { maxX = x1; }
			if (x2 < minX) { minX = x2; } if (x2 > maxX) { maxX = x2; }
			if (y1 < minY) { minY = y1; } if (y1 > maxY) { maxY = y1; }
			if (y2 < minY) { minY = y2; } if (y2 > maxY) { maxY = y2; }
		}
		for (var wireIdx in pkg.wires) {
			var wire = pkg.wires[wireIdx],
			    x1 = elem.x + rotMat[0]*wire.x1 + rotMat[1]*wire.y1,
			    y1 = elem.y + rotMat[2]*wire.x1 + rotMat[3]*wire.y1,
			    x2 = elem.x + rotMat[0]*wire.x2 + rotMat[1]*wire.y2,
			    y2 = elem.y + rotMat[2]*wire.x2 + rotMat[3]*wire.y2,
			    width = wire.width;
			if (x1-width < minX) { minX = x1-width; } if (x1+width > maxX) { maxX = x1+width; }
			if (x2-width < minX) { minX = x2-width; } if (x2+width > maxX) { maxX = x2+width; }
			if (y1-width < minY) { minY = y1-width; } if (y1+width > maxY) { maxY = y1+width; }
			if (y2-width < minY) { minY = y2-width; } if (y2+width > maxY) { maxY = y2+width; }
			if (x1 < minX) { minX = x1; } if (x1 > maxX) { maxX = x1; }
			if (x2 < minX) { minX = x2; } if (x2 > maxX) { maxX = x2; }
			if (y1 < minY) { minY = y1; } if (y1 > maxY) { maxY = y1; }
			if (y2 < minY) { minY = y2; } if (y2 > maxY) { maxY = y2; }
		}
	}
	return [minX, minY, maxX, maxY];
}

EagleCanvas.prototype.scaleToFit = function(a) {
	if (!this.scaleToFitId) { return; }
	var fitElement = document.getElementById(this.scaleToFitId);
	if (!fitElement) { return; }
	var fitWidth  = fitElement.offsetWidth,
	    fitHeight = fitElement.offsetHeight,
	    scaleX    = fitWidth / this.nativeSize[0],
	    scaleY    = fitHeight / this.nativeSize[1],
	    scale     = Math.min(scaleX, scaleY);
	scale *= 0.9;
	this.minScale = scale / 10;
	this.maxScale = scale * 10;
	this.setScale(scale);
}

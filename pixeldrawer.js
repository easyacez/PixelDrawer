function PixelDrawer(canvas)
{
	var drawer = this;
	this.canvas = (typeof canvas=="string")?$("#"+canvas):$(canvas);
	this.context = this.canvas[0].getContext("2d");
	this._raw = [];
	this._toDraw = false;
	this._toEdit = false;
    this._toErase = false;
	this._active = 0;
    this._duration = 0;

    this.editable = function(toEdit){
        if(typeof toEdit == "undefined") return drawer._toEdit;
        if(drawer._toEdit != toEdit)
        {
            drawer._toEdit = toEdit;
            if(toEdit)
            {
                this.canvas.mousedown(function(){
                    drawer._toDraw = true;
                }).mouseup(function(){
                    drawer._toDraw = false;
                }).mousemove(function(e){
                    e.preventDefault();
                    if(drawer._toDraw)
                    {
                        var offset = drawer.canvas.offset(),
                            x = e.pageX - offset.left,
                            y = e.pageY - offset.top;   
                        x -= x % drawer.pixel; y -= y % drawer.pixel;
                        if(drawer._toErase) drawer.erase(drawer._active, x, y);
                        else drawer.draw(drawer._active, x, y);
                    }
                });
            }
            else { this.canvas.unbind("mousedown").unbind("mouseup").unbind("mousemove"); }
        }
    };

}
PixelDrawer.prototype = {
	pixel : 10,
    bgColor : "black",
    fgColor : "black",
	frameInterval : 1000, //ms
	position : function(x, y){
		return {n : Math.round(x / this.pixel), m : Math.round(y / this.pixel)};
	},
    set : function(frame, x, y){
        var p = this.position(x, y);
        if(typeof this._raw[frame] == "undefined") this._raw[frame] = {};
        if(typeof this._raw[frame][p.n] == "undefined") this._raw[frame][p.n] = {};
        this._raw[frame][p.n][p.m] = 1;
    },
    unset : function(frame, x, y){
        var p = this.position(x, y);
        if(typeof this._raw[frame] != "undefined" && typeof this._raw[frame][p.n] != "undefined")
		    delete this._raw[frame][p.n][p.m];
    },
    restore : function(image){
        if(typeof image != "undefined") this.image = image;
		if(this.image) this._raw = JSON.parse(this.image);
        else this._raw = [];
    },
    save : function(){
        this.image = JSON.stringify(this._raw);
    },
	export : function(toTrim){
        return this.image;
	},
    draw : function(frame, x, y){
        var pix = this.pixel;
		if(x+pix <= this.canvas.width() && y+pix <= this.canvas.height())
		{
			this.context.save();
			this.context.fillStyle = (frame==0 ? this.bgColor : this.fgColor);
			this.context.fillRect(x, y, pix, pix);
			this.context.restore();
            this.set(frame, x, y);
		}
    },
    erase : function(frame, x, y){
        var pix = this.pixel;
		if(x+pix <= this.canvas.width() && y+pix <= this.canvas.height())
		{
            this.context.clearRect(x, y, pix, pix);
            this.unset(frame, x, y);
		}
    },
    each : function(frame, fn){
        if(typeof this._raw[frame] != "undefined")
        {
            for(var n in this._raw[frame])
            {
                for(var m in this._raw[frame][n])
                    fn.call(this, parseInt(n), parseInt(m));
            }
        }
    },
	clear : function(){
		this.context.clearRect(0, 0, this.canvas.width(), this.canvas.height());
        this._raw = [];
	},
    _display : function(frame){
        var pix = this.pixel;
        this.clear();
        this.context.save();
        this.context.fillStyle = this.bgColor;
        if(this._toEdit && frame) this.context.globalAlpha=0.5;
        this.each(0, function(n, m){
            this.context.fillRect(n*pix, m*pix, pix, pix);
        });
        this.context.restore();
        if(frame)
        {
            this.context.fillStyle = this.fgColor;
            this.each(frame, function(n, m){
                this.context.fillRect(n*pix, m*pix, pix, pix);
            });    
            this.context.restore();
        }
    },
    activate : function(active){
        active = active ? parseInt(active) : 0;
        this._display(active);
        this._active = active;
    },
	loop : function(dt){
		if(this._raw.length > 1)
		{
			if(dt >= this._duration)
			{
				act = this._active + 1;
				if(typeof this._raw[act] == "undefined")
					act = 1;
				this._duration = this.frameInterval;
				this.activate(act);
			} else {
				this._duration -= dt;
			}
		}
    },
    erasable : function(toErase){
        if(typeof toErase == "undefined") return this._toErase;
        this._toErase = toErase;
    }
}



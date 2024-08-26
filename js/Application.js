export class Application{
    constructor(canvas){
        this.callUpdate = this.callUpdate.bind(this);
        this.canvas = canvas;
        this.gl = null;
        try {
            this.gl = this.canvas.getContext('webgl2');
        } catch (error) {console.log(error)}
        if (!this.gl) {
            console.log('Error - Cannot create WebGL 2.0 context');
        }
    }
    async init() {
        await this.start();
        requestAnimationFrame(this.callUpdate);
    }
    start(){
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(gl.COLOR_BUFFER_BIT);    
    }
    update(){
        
    }
    render(){
        
    }
    resize(){

    }
    callUpdate(){
        this.callResize();
        this.update();
        this.render();
        requestAnimationFrame(this.callUpdate);
    }
    callResize() {
        //this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    }
}
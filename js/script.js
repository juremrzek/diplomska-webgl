import {Application} from './Application.js'
import {shaders} from './shaders.js'
const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;

class Game extends Application {
    async start(){
        //Create global variables
        this.player = new Player();
        this.time = performance.now();
        this.startTime = this.time;

        //Local variables so we don't have to call this every time
        const gl = this.gl;
        const player = this.player;

        //---------WebGL initialization-----------------------------------------------------------------------------------------
        //Create vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, shaders.shader1.vertex); //set string source from shaders.js
        gl.compileShader(vertexShader);

        //Create fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, shaders.shader1.fragment);
        gl.compileShader(fragmentShader);

        //Create program and attach shaders
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        // Try to link.
        gl.linkProgram(program);

        // Get link status and report error if linkage failed.
        const programStatus = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!programStatus) {
            const log = gl.getProgramInfoLog(program);
            console.log(gl.getShaderInfoLog(vertexShader));
            console.log(gl.getShaderInfoLog(fragmentShader));
            throw new Error('Cannot link program\nInfo log:\n' + log);
        }

        //Start the program and enable depth test
        gl.useProgram(program);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.depthFunc(gl.LESS);
        //-------------------------------------------------------------------------------------------------------------------------------------
        
        //Load json file
        const response = await fetch('./Test.json');
        const temp = await response.json();
        const json = [JSON.stringify(temp)]
        const pyramidObject = JSON.parse(json);
        const mesh = pyramidObject.meshes[1];

        const vertices = new Float32Array(mesh.vertices);

        const verticesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        const aPositionLoc = gl.getAttribLocation(program, 'aPosition');
        gl.enableVertexAttribArray(aPositionLoc);
        gl.vertexAttribPointer(
            aPositionLoc, //attribute location
            3,            //število komponent
            gl.FLOAT,     //tip komponent
            false,        //normalize
            3*4,          //stride - velikost posameznega bloka podatkov v arrayu - kjer se podatki začnejo ponovno pošiljati za drug objekt.
            0,            //offset - odmik v bloku. Na prvem atributu je 0, potem pa treba incrementat, drugače bi overwritali data.
        );

        //gl.vertexAttribPointer(aColorLoc, 3, gl.FLOAT, false, 6*4, 3*4);
        const indices = new Uint16Array(mesh.faces.flat(1));
        this.elementCount = indices.length;
        this.indicesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        //Kreiranje MVP matrik
        this.modelMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();
        mat4.scale(this.modelMatrix, this.modelMatrix, [.5, .5, .5]);
        mat4.lookAt(
            this.viewMatrix,   //Matrika kamera
            [0, 0, -1],        //Lokacija kamere
            player.pos,        //V katero točko naj gleda kamera
            [0, 1, 0]          //Katera smer je gor
        );
        mat4.perspective(this.projectionMatrix, Math.PI/1.5, gl.canvas.width/gl.canvas.height, 0.0001, 20);

        //Event listeners
        window.addEventListener('keydown', (event) => {
            if(event.key == "w" || event.key == "W")
                player.forward = true;
            if(event.key == "s" || event.key == "A")
                player.backwards = true;
            if(event.key == "a" || event.key == "S")
                player.left = true;
            if(event.key == "d" || event.key == "D")
                player.right = true;
            if(event.key == "ArrowLeft")
                player.rotateLeft = true;
            if(event.key == "ArrowRight")
                player.rotateRight = true;
        });
        window.addEventListener('keyup', (event) => {
            if(event.key == "w" || event.key == "W")
                player.forward = false;
            if(event.key == "s" || event.key == "A")
                player.backwards = false;
            if(event.key == "a" || event.key == "S")
                player.left = false;
            if(event.key == "d" || event.key == "D")
                player.right = false;
            if(event.key == "ArrowLeft")
                player.rotateLeft = false;
            if(event.key == "ArrowRight")
                player.rotateRight = false;
        });

        //Izračunamo MVP matriko in pošljemo v vertex shader
        this.uMvpMatrixLoc = gl.getUniformLocation(program, 'uMvpMatrix');
        this.mvpMatrix = getMvpMatrix(this.modelMatrix, this.viewMatrix, this.projectionMatrix);
        gl.uniformMatrix4fv(this.uMvpMatrixLoc, false, this.mvpMatrix);

        //Shading
        this.uLightDirectionLoc = gl.getUniformLocation(program, 'uLightDirection');
        this.lightDirection = [1, 0, -1];

        gl.uniform3fv(this.uLightDirectionLoc, this.lightDirection);

        const normals = new Float32Array(mesh.normals);
        this.normalsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

        const aNormalLoc = gl.getAttribLocation(program, 'aNormal');
        gl.enableVertexAttribArray(aNormalLoc);
        gl.vertexAttribPointer(aNormalLoc, 3, gl.FLOAT, false, 3*4, 0);

        //Draw triangles - each point in bufferData is a vertex.
        gl.drawElements(gl.TRIANGLES, this.elementCount, gl.UNSIGNED_SHORT, 0);
    }
    update(){
        //get dt so that the game is equally fast regardless of device performance
        const t = this.time = performance.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;

        const gl = this.gl;
        const player = this.player;
        player.direction = [0,0,0];

        //PLAYER MOVEMENT
        if(player.forward){
            player.direction[2] += player.speed*dt;
        }
        if(player.backwards){
            player.direction[2] -= player.speed*dt;
        }
        if(player.left){
            player.direction[0] += player.speed*dt;
        }
        if(player.right){
            player.direction[0] -= player.speed*dt;
        }
        if(player.rotateLeft){
            mat4.rotateY(this.modelMatrix, this.modelMatrix, player.rotateSpeed*dt);
        }
        if(player.rotateRight){
            mat4.rotateY(this.modelMatrix, this.modelMatrix, -player.rotateSpeed*dt);
        }
        mat4.translate(this.modelMatrix, this.modelMatrix, player.direction);
        //Update player.pos so we know where to look with the camera.
        mat4.getTranslation(player.pos, this.modelMatrix);

        //send mvp matrix to vertex shader
        this.mvpMatrix = getMvpMatrix(this.modelMatrix, this.viewMatrix, this.projectionMatrix);
        gl.uniformMatrix4fv(this.uMvpMatrixLoc, false, this.mvpMatrix);

        //Shading
        vec3.rotateY(this.lightDirection, this.lightDirection, [0,0,0], 0.02);
        //console.log(this.lightDirection[2]);
        gl.uniform3fv(this.uLightDirectionLoc, this.lightDirection);
    }
    render(){
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, this.elementCount, gl.UNSIGNED_SHORT, 0);
    }
}
//Začetek programa
const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const game = new Game(canvas);
await game.init();

function getMvpMatrix(modelMatrix, viewMatrix, projectionMatrix){
    let mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, projectionMatrix, viewMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, modelMatrix);
    return mvpMatrix;
}

V3.Camera = class extends GM.CameraMVP
{
    constructor(canvas, projection)
    {
        super(canvas, projection);
        
        this.modelViewMatrixStack2 = [];
        
        // 
        this.min = { x:Number.POSITIVE_INFINITY, y:Number.POSITIVE_INFINITY, z:Number.POSITIVE_INFINITY };
        this.max = { x:Number.NEGATIVE_INFINITY, y:Number.NEGATIVE_INFINITY, z:Number.NEGATIVE_INFINITY };
        
        V.recvMessage("camera.distance.get", (args) => 
        { 
            V.postMessage("camera.distance.get", GM.Vector3.distance(this.position, args)); 
        });
        
        V.recvMessage("camera.get", (args) => 
        { 
            V.postMessage("camera.get", this.toJson()); 
        });
        
        V.recvMessage("camera", (args) => 
        { 
            this.set(args);
            V.refresh = true;
            V.touch2d();
            V.touch3d();
        });
        
        V.recvMessage("viewpoint.get", (args) => 
        { 
            args.camera = this.toJson();
        });
    }

    pushWorldMatrix(matrix) 
    {
        this.modelViewMatrixStack2.push(GM.Matrix4.init(this.modelViewMatrix));
        GM.Matrix4.multiply(this.inverse, matrix, this.modelViewMatrix);
    };
    
    popWorldMatrix() 
    {
        GM.Matrix4.copy(this.modelViewMatrixStack2[this.modelViewMatrixStack2.length-1], this.modelViewMatrix);
        this.modelViewMatrixStack2.pop()
    };
    
    set(camera)
    {
        super.set(camera);
        V.postMessage("camera", camera); 
    };

    
    distanceTo(point)
    {
        let dx = point.x - this.position.x;
        let dy = point.y - this.position.y;
        let dz = point.z - this.position.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    };
}



V3.Controller = class extends V.Controller
{
    constructor()
    {
        super(V.EventHandler.PRIO1, V.EventHandler.PRIO0, V.camera, 6);
        V3.Controller.instance = this;
        
        this.controllers = {}
        this.controllers["orbiter"] = new V3.Orbiter(V.camera);
        this.controllers["flyer"] = new V3.Flyer(V.camera);
        this.controllers["walker"] = new V3.Walker(V.camera);
        this.controllers["manual"] = new V3.Manual(V.camera);
        
        /*
        if (('ontouchstart' in window && mode == V3.VIEWER)) 
        {
            let panControl = document.getElementById("panel-touch-pan");
            panControl.hidden = false;
            this.touchControl(panControl.querySelector("svg:nth-of-type(1)"), V.KEY_UP);
            this.touchControl(panControl.querySelector("svg:nth-of-type(2)"), V.KEY_A);
            this.touchControl(panControl.querySelector("svg:nth-of-type(3)"), V.KEY_D);
            this.touchControl(panControl.querySelector("svg:nth-of-type(4)"), V.KEY_DOWN);
            
            let zoomControl = document.getElementById("panel-touch-zoom");
            zoomControl.hidden = false;
            this.touchControl(zoomControl.querySelector("svg:nth-of-type(1)"), V.KEY_W);
            this.touchControl(zoomControl.querySelector("svg:nth-of-type(2)"), V.KEY_S);
        }
        */
            
        V.recvMessage("controller.view", (args) =>
        {
            let aabb = args.aabb
            if (!aabb)
            {
                if (args.min && args.max)
                {
                    aabb = GL.BoundingBox.create(args.min, args.max);
                }
            }
            
            if (this.active)
            {
                if (this.active.focus)
                {
                    this.active.focus(aabb, this);
                }
                
                V.postMessage("controller.view", args); 
            }
            else
            {
                V.postMessage("error", "No controller acive");
            }
            
        });
        
        V.recvMessage("controller.target", (args) =>
        {
            if (this.active)
            {
                if (this.active.target)
                {
                    this.active.target(args, this);
                }
                V.postMessage("controller.view", args); 
            }
            else
            {
                V.postMessage("error", "No controller acive");
            }
        });
        
        V.recvMessage("controller", (args) => 
        { 
            let current = this.active;
            
            if (args.hasOwnProperty("name"))
            {
                if (this.active != this.controllers[args.name])
                {
                    if (this.controllers[args.name])
                    {
                        this.active = this.controllers[args.name];
                    }
                }
            }
            
            if (this.active)
            {
                if (this.active.init)
                {
                    this.active.init(args, this, current);
                }
                
                V.postMessage("controller", this.active.toJson()); 
            }
            else
            {
                V.postMessage("error", "no controller selected"); 
            }
            
            V.camera.moving = true;
            V.touch3d();
            V.touch2d();
        });
        
        V.recvMessage("viewpoint", (viewpoint) => 
        { 
            if (viewpoint.controller)
            {
                let current = this.active;
                
                if (this.active != this.controllers[viewpoint.controller.name])
                {
                    this.active = this.controllers[viewpoint.controller.name];
                }
                
                if (this.active.init)
                {
                    this.active.init(viewpoint.controller, this, this.active);
                }
                
                V.postMessage("controller", this.active.toJson());
            }
            else
            {
                this.active = null;
            }
            
            V.camera.projection.set(viewpoint.camera.projection);
            
            this.tweenPosition(viewpoint.camera.position);
            this.tweenRotation(viewpoint.camera.rotation);
            this.tweenStart();
            V.postMessage("camera", viewpoint.camera); 
        });
        
        V.recvMessage("viewpoint.get", (args) => 
        { 
            if (this.active)
            {
                args.controller = this.active.toJson();
            }
        });
    }
    
    
    load()
    {
        let center = GL.BoundingBox.center(V.viewer.aabb, {});
        let distance = GL.BoundingBox.diagonal(V.viewer.aabb);

        GM.Euler.copy(V3.Controller.rotation, V.camera.rotation)
        GM.Vector3.addScalar(center, GM.Euler.zAxisT(V3.Controller.rotation, {}), distance, V.camera.position);
    }
    
    //
    // Events
    //
    
    onUpdate(event) 
    {
        super.onUpdate(event);
            
        if (this.active && this.active.update)
        {
            this.active.update(this);
        }
    }
    
    onDblClick(event)
    {
        if (!super.onDblClick(event))
        {
            let cast3d = V.Controller.cast3d;
        //	console.log(cast3d.distance);
            if (cast3d.distance != Number.POSITIVE_INFINITY)
            {
                V.postMessage(V.viewer.datasets[cast3d.id].type+".dblclick",cast3d);
            }
        }
        event.stopImmediatePropagation();
    }
    


    //
    onMouseDown(event) 
    {
        super.onMouseDown(event);
        
        if (this.active && this.active.mouseDown)
        {
            this.active.mouseDown(event, this);
        }
    }
    
    onMouseWheel(event) 
    {
        super.onMouseWheel(event);
        
        if (this.active && this.active.mouseWheel)
        {
            this.active.mouseWheel(event, this);
        }
    }   

    onKeyDown(event) 
    {
        super.onKeyDown(event);
        
        if (this.active && this.active.keyDown)
        {
            this.active.keyDown(event, this);
        }
    }

    onNavCube(event) 
    {
        if (this.active && this.active.navCube)
        {
            this.active.navCube(event, this);
        }
    }
    
    
    onTouchStart(event) 
    {
        super.onTouchStart(event);
        
        if (this.active && this.active.onTouchDown)
        {
            this.active.onTouchDown(event, this);
        }
    }
    
    onTouchMove(event) 
    {
        super.onTouchMove(event);
        
        if (this.active && this.active.onTouchMove)
        {
            this.active.onTouchMove(event, this);
        }
    }
    
    onTouchEnd(event) 
    {
        super.onTouchEnd(event);
        
        if (this.active && this.active.onTouchEnd)
        {
            this.active.onTouchEnd(event, this);
        }
    }


    touchControl(element, key)
    {
        element.addEventListener("touchstart", (event)=>
        {
            var touches = event.targetTouches;
            if (touches.length == 1)
            {
                if (this.timer)
                {
                    clearInterval(this.timer);
                }
                
                document.dispatchEvent(new KeyboardEvent('keydown',{'keyCode':key}));
                this.timer = setInterval(()=> {document.dispatchEvent(new KeyboardEvent('keydown',{'keyCode':key}))}, 20);
            }
        });
        
        element.addEventListener("touchend", (event)=>
        {
            var touches = event.targetTouches;
            if (this.timer)
            {
                clearInterval(this.timer);
            }
        });
    }
}

V3.Controller.rotation = GM.Euler.create(-Math.PI/8, 0, 0);


V.Controller.cast3d = { distance: Number.POSITIVE_INFINITY };





V3.Orbiter = class
{
    constructor(camera)
    {
        this.camera = camera;
        
        this.matrixUP = GM.Matrix4.create();
        this.inverseUP = GM.Matrix4.create();
        this.rotation = GM.Euler.copy(V3.Controller.rotation, {})
        this.matrix = GM.Matrix4.create();
            
        this.zoomFn = (ctr) =>
        {
            let dO = 0;
            if (Math.abs(this.targetOrbit - this.orbit) > 0.1)
            {
                dO = (this.targetOrbit - this.orbit)*0.29;
            }
            else
            {
                dO = this.targetOrbit - this.orbit;
                ctr.actionFn = null;
            }
            this.orbit += dO;
            GM.Vector3.addScalar(this.camera.position, this.camera.zAxis, dO, this.camera.position);
        }
        
        this.panFn = (ctr) =>
        {
            let dx = (ctr.currPos.x - ctr.startPos.x)/ctr.dragMax;
            let dy = (ctr.currPos.y - ctr.startPos.y)/ctr.dragMax;
            ctr.startPos.x += dx;
            ctr.startPos.y += dy;
            
            this.camera.position.x -= this.orbit*(this.camera.xAxis.x*dx + this.camera.yAxis.x*dy);
            this.camera.position.y -= this.orbit*(this.camera.xAxis.y*dx + this.camera.yAxis.y*dy);
            this.camera.position.z -= this.orbit*(this.camera.xAxis.z*dx + this.camera.yAxis.z*dy);
        }


        this.rotateFn = (ctr) =>
        {
            let target = GM.Vector3.addScalar(this.camera.position, this.camera.zAxis, -this.orbit, {});

            let dx = (ctr.currPos.x - ctr.startPos.x)/ctr.dragMax;
            let dy = (ctr.currPos.y - ctr.startPos.y)/ctr.dragMax;
            ctr.startPos.x += dx;
            ctr.startPos.y += dy;
            
            GM.Matrix4.multiply(this.inverseUP, this.camera.matrix, this.matrix);
            GM.Euler.fromMatrix(this.matrix, this.rotation);
            
            this.rotation.x = GM.clamp(this.rotation.x+dy, -1.57079632679,1.57079632679);
            this.rotation.y = this.rotation.y-4*dx;
            this.rotation.z = 0;

            GM.Matrix4.fromEuler(this.rotation, this.matrix);
            GM.Matrix4.multiply(this.matrixUP, this.matrix, this.matrix);
            
            GM.Euler.fromMatrix(this.matrix, this.camera.rotation);

            /*			
            let dx = (ctr.currPos.x - ctr.startPos.x)/ctr.dragMax;
            let dy = (ctr.currPos.y - ctr.startPos.y)/ctr.dragMax;
            ctr.startPos.x += dx;
            ctr.startPos.y += dy;

            this.camera.rotation.x = GM.clamp(this.camera.rotation.x+dy, -1.57079632679,1.57079632679);
            this.camera.rotation.y = this.camera.rotation.y-4*dx;
            this.camera.rotation.z = 0;
            */
        
            /*
            let dx = (ctr.currPos.x - ctr.startPos.x)/ctr.dragMax;
            let dy = (ctr.currPos.y - ctr.startPos.y)/ctr.dragMax;
            ctr.startPos.x += dx;
            ctr.startPos.y += dy;

            this.rotation.x = GM.clamp(this.rotation.x+dy, -1.57079632679,1.57079632679);
            this.rotation.y = this.rotation.y-4*dx;
            GM.Matrix4.fromEuler(this.rotation, this.matrix);
            GM.Matrix4.multiply(this.matrixUP, this.matrix, this.matrix);
            GM.Euler.fromMatrix(this.matrix, this.camera.rotation);
            */
            
            
            let zAxisT = GM.Euler.zAxisT(this.camera.rotation, {});
            GM.Vector3.addScalar(target, zAxisT, this.orbit, this.camera.position);
        }
        
        this.orbitFn = (ctr) =>
        {
            let target = GM.Vector3.addScalar(this.camera.position, this.camera.zAxis, -this.orbit, {})
            let zAxisT = GM.Euler.zAxisT(this.camera.rotation, {});
            GM.Vector3.addScalar(target, zAxisT, this.orbit, this.camera.position);
        }
    }
    
    init(config, ctr, previous)
    {
        this.maxOrbit = GL.BoundingBox.diagonal(V.viewer.aabb);
        this.minOrbit = this.maxOrbit/300;
        
        if (config.hasOwnProperty("orbit"))
        {
            this.orbit = config.orbit;
        }
        else
        {
            if (config.min && config.max)
            {
                let aabb = GL.BoundingBox.create(config.min, config.max);
                let orbit = GL.BoundingBox.diagonal(aabb);
                if (isFinite(orbit))
                {
                    config.position = GM.Vector3.addScalar(GL.BoundingBox.center(aabb, {}), this.camera.zAxis, orbit, {});
                    this.orbit = orbit;
                }
            }
            else if (previous && previous instanceof V3.Flyer)
            {
                this.orbit = previous.range;
            }
            else if (previous && previous instanceof V3.Walker)
            {
                this.orbit = V3.Walker.HEIGHT;
            }
            else
            {
                this.orbit = this.maxOrbit;
            }
        }
        
        if (config.hasOwnProperty("up"))
        {
            GM.Matrix4.quaternion(GM.Quaternion.between(GM.Vector3.create(0,1,0), GM.Vector3.create(config.up.x,config.up.y,config.up.z), {}), this.matrixUP);
            GM.Matrix4.invert(this.matrixUP, this.inverseUP);
        
            GM.Matrix4.fromEuler(this.rotation, this.matrix);
            GM.Matrix4.multiply(this.matrixUP, this.matrix, this.matrix);
            GM.Euler.fromMatrix(this.matrix, this.camera.rotation);
        }
        
        V.camera.set(config);
    }
    

    focus(aabb, ctr)
    {
        let orbit = GL.BoundingBox.diagonal(aabb);
        if (isFinite(orbit))
        {
            let point = GL.BoundingBox.center(aabb, {});
            
            this.orbit = orbit;
            ctr.tweenPosition(GM.Vector3.addScalar(point, this.camera.zAxis, orbit, {}));
            ctr.tweenStart();
        }
    }
    
    target(point, ctr)
    {
        if (isFinite(point.x) && isFinite(point.y) && isFinite(point.z))
        {
            this.orbit = Math.min(this.orbit, GM.Vector3.distance(V.camera.position, point));
            ctr.tweenPosition(GM.Vector3.addScalar(point, this.camera.zAxis, this.orbit, {}));
            ctr.tweenStart();
        }
    }
        
    
    //
    //
    //

    navCube(euler, ctr)
    {
        ctr.tweenRotation(euler);
        ctr.tweenStart(this.orbitFn);
    }

    
    mouseDown(event, ctr) 
    {
        ctr.tweenStop();
        if (event.button == 0)
        {
            ctr.actionFn = this.rotateFn;
        }
        else if (event.button == 2)
        {
            ctr.actionFn = this.panFn;
        }
    }

    mouseWheel(event, ctr) 
    {
        ctr.tweenStop();
        
        this.targetOrbit = Math.max(1.1*this.minOrbit, this.orbit + 4*ctr.currZoomD*(this.orbit -  this.minOrbit));
        
        ctr.actionFn = this.zoomFn;
    }   

    keyDown(event, ctr) 
    {
        ctr.tweenStop();
        if (event.keyCode == V.KEY_W)
        {
            this.targetOrbit = Math.max(this.minOrbit, 0.85*this.orbit);
            
            ctr.actionFn = this.zoomFn;
        }
        else if (event.keyCode == V.KEY_S)
        {
            this.targetOrbit += Math.max(0.5, 0.1*(this.orbit -  this.minOrbit));
            
            ctr.actionFn = this.zoomFn;
        } 
        else if (event.keyCode == V.KEY_A)
        {
            ctr.setAction(this.panFn, 0.05, 0);
        }
        else if (event.keyCode == V.KEY_D)
        {
            ctr.setAction(this.panFn, -0.05, 0);
        } 
        else if (event.keyCode == V.KEY_LEFT)
        {
            ctr.setAction(this.rotateFn, -0.1, 0);
        }
        else if (event.keyCode == V.KEY_RIGHT)
        {
            ctr.setAction(this.rotateFn, 0.1, 0);
        }
        else if (event.keyCode == V.KEY_UP)
        {
            ctr.setAction(this.panFn, 0, -0.05);
        }
        else if (event.keyCode == V.KEY_DOWN)
        {
            ctr.setAction(this.panFn, 0, 0.05);
        }
    }
    
    toJson() 
    {
        return { name: "orbiter", orbit: this.orbit };
    }
}
    





V3.Flyer = class 
{
    constructor(camera) 
    {
        this.camera = camera;
        
        this.flyFn = (ctr) =>
        {
            if (Math.abs(ctr.currZoom) > 0.005)
            {
                var distance = 0.25*ctr.currZoom*this.range;  
                if (ctr.currZoom < 0)
                {
                    distance = Math.min(-0.10, distance);
                }
            
                ctr.currZoom *= 0.9;
                if (Math.abs(ctr.currZoom) <= 0.005)
                {
                    ctr.currZoom = 0.0;
                }
                
                let flyDir = V.Controller.pointerRay.direction;

                this.camera.position.x += distance * flyDir.x;
                this.camera.position.y += distance * flyDir.y;
                this.camera.position.z += distance * flyDir.z;

                if (V.Controller.cast3d.distance != Number.POSITIVE_INFINITY)
                {
                    this.range = Math.max(0.4,this.range - distance);
                }
            }
            else
            {
                ctr.actionFn = null;
            }
        }
        
        this.panFn = (ctr) =>
        {
            var dx = (ctr.currPos.x - ctr.startPos.x)/ctr.dragMax;
            var dy = (ctr.currPos.y - ctr.startPos.y)/ctr.dragMax;
            ctr.startPos.x += dx;
            ctr.startPos.y += dy;
            
            this.camera.position.x -= 0.9*this.range*(this.camera.xAxis.x*dx + this.camera.yAxis.x*dy);
            this.camera.position.y -= 0.9*this.range*(this.camera.xAxis.y*dx + this.camera.yAxis.y*dy);
            this.camera.position.z -= 0.9*this.range*(this.camera.xAxis.z*dx + this.camera.yAxis.z*dy);
        }
        
        this.rotateFn = (ctr) =>
        {
            var dx = (ctr.currPos.x - ctr.startPos.x)/ctr.dragMax;
            var dy = (ctr.currPos.y - ctr.startPos.y)/ctr.dragMax;
            ctr.startPos.x += dx;
            ctr.startPos.y += dy;

            this.camera.rotation.x = GM.clamp(this.camera.rotation.x+dy, -1.57079632679,1.57079632679);
            this.camera.rotation.y = this.camera.rotation.y-(this.shiftKey?0.4:4)*dx;
            this.camera.rotation.z = 0;
        }
                
        
        this.mouseStamp = 0;
    }

    init(config, ctr)
    {
        this.range = GL.BoundingBox.diagonal(V.viewer.aabb);
    }

    target(point, ctr)
    {
        let vector = GM.Vector3.sub(point, V.camera.position, {});
        GM.Vector3.scale(vector, 0.85, vector);
        ctr.tweenPosition(GM.Vector3.add(V.camera.position, vector, point)); 
        GM.Vector3.normalize(vector, vector);
        ctr.tweenRotation(GM.Euler.fromDirection(vector));
        ctr.tweenStart();
    };

    // 
    //
    //
    
    update(ctr)
    {
        if (!ctr.actionFn)
        {
            if (V.Controller.cast3d.distance != Number.POSITIVE_INFINITY)
            {
                this.range = V.Controller.cast3d.distance;
            }
        }
    }
    
    mouseDown(event, ctr) 
    {
        ctr.tweenStop();
        if (event.button == 0)
        {
            ctr.actionFn = this.rotateFn;
        }
        else if (event.button == 2)
        {
            ctr.actionFn = this.panFn;
        }
    };

    mouseWheel(event, ctr) 
    {
        ctr.tweenStop();
        ctr.actionFn = this.flyFn;
    }      

    keyDown(event, ctr) 
    {
        ctr.tweenStop();
        if (event.keyCode == V.KEY_W)
        {
            ctr.setAction(this.flyFn, 0, 0, 0.1);
        }
        else if (event.keyCode == V.KEY_S)
        {
            ctr.setAction(this.flyFn, 0, 0,-0.1);
        } 
        else if (event.keyCode == V.KEY_A)
        {
            ctr.setAction(this.panFn, 0.05, 0);
        }
        else if (event.keyCode == V.KEY_D)
        {
            ctr.setAction(this.panFn, -0.05, 0);
        } 
        else if (event.keyCode == V.KEY_LEFT)
        {
            ctr.setAction(this.rotateFn, -0.1, 0);
        }
        else if (event.keyCode == V.KEY_RIGHT)
        {
            ctr.setAction(this.rotateFn, 0.1, 0);
        }
        else if (event.keyCode == V.KEY_UP)
        {
            ctr.setAction(this.panFn, 0, -0.05);
        }
        else if (event.keyCode == V.KEY_DOWN)
        {
            ctr.setAction(this.panFn, 0, 0.05);
        }
    }
    
    toJson() 
    {
        return { name: "flyer" };
    }
}






V3.Walker = class 
{
    constructor(camera) 
    {
        this.camera = camera;
        
        this.walkFn = (ctr) =>
        {
            let dx = 0;
            let dy = 0;
            let dz = 0;
        
            if (V.keyMap[V.KEY_W])
            {
                dx -= this.walkSpeed*this.camera.zAxis.x;
                dy -= this.walkSpeed*this.camera.zAxis.y;
                dz -= this.walkSpeed*this.camera.zAxis.z;
            }
            else if (V.keyMap[V.KEY_S])
            {
                dx += this.walkSpeed*this.camera.zAxis.x;
                dy += this.walkSpeed*this.camera.zAxis.y;
                dz += this.walkSpeed*this.camera.zAxis.z;
            }
            
            if (V.keyMap[V.KEY_A])
            {
                dx -= this.walkSpeed*this.camera.xAxis.x;
                dy -= this.walkSpeed*this.camera.xAxis.y;
                dz -= this.walkSpeed*this.camera.xAxis.z;
            }
            else if (V.keyMap[V.KEY_D])
            {
                dx += this.walkSpeed*this.camera.xAxis.x;
                dy += this.walkSpeed*this.camera.xAxis.y;
                dz += this.walkSpeed*this.camera.xAxis.z;
            }
            
            if (dx || dy || dz)
            {
                this.camera.position.x += dx*V.dT; // JSTIER use V.dT and remove from event
                this.camera.position.y += dy*V.dT;
                this.camera.position.z += dz*V.dT;
                this.snapToGround(this.camera.position);
            }
            
            this.rotateFn(ctr);
        }
        
        this.rotateFn = (ctr) =>
        {
            var dx = (ctr.currPos.x - ctr.startPos.x)/ctr.dragMax;
            var dy = (ctr.currPos.y - ctr.startPos.y)/ctr.dragMax;
            ctr.startPos.x += dx;
            ctr.startPos.y += dy;

            this.camera.rotation.x = GM.clamp(this.camera.rotation.x+dy, -1.57079632679,1.57079632679);
            this.camera.rotation.y = this.camera.rotation.y-(this.shiftKey?0.4:4)*dx;
            this.camera.rotation.z = 0;
        }

        this.panFn = (ctr) =>
        {
            var dx = (ctr.currPos.x - ctr.startPos.x)/ctr.dragMax;
            var dy = (ctr.currPos.y - ctr.startPos.y)/ctr.dragMax;
            ctr.startPos.x += dx;
            ctr.startPos.y += dy;
            
            this.camera.position.x -= 0.9*V3.Walker.HEIGHT*(this.camera.xAxis.x*dx + this.camera.yAxis.x*dy);
            this.camera.position.y -= 0.9*V3.Walker.HEIGHT*(this.camera.xAxis.y*dx + this.camera.yAxis.y*dy);
            this.camera.position.z -= 0.9*V3.Walker.HEIGHT*(this.camera.xAxis.z*dx + this.camera.yAxis.z*dy);
        }

        
        this.walkSpeed = 3.4;
        this._sampleRay = new GM.Ray(new GM.Vector3(), new GM.Vector3(0,-1,0))
    }
    
    init(config, ctr)
    {
        if (config.target)
        {
            this.target(config.target, ctr);
        }
        
    }
        
    target(point, ctr)
    {
        point.y += V3.Walker.HEIGHT;
        this.snapToGround(point);
        ctr.tweenPosition(point);
        GM.Vector3.subtract(point, this.camera.position, point);
        point.y = 0;
        GM.Vector3.normalize(point, point);
        ctr.tweenRotation(GM.Euler.fromDirection(point));
        ctr.tweenStart();
    };
    
    //
    //
    //
    
    mouseDown(event, ctr) 
    {
        ctr.tweenStop();
        if (event.button == 0)
        {
            ctr.actionFn = this.rotateFn;
        }
        else if (event.button == 2)
        {
            ctr.actionFn = this.panFn;
        }
    };
    
    mouseWheel(event, ctr) 
    {
        ctr.tweenStop();
        this.walkSpeed = Math.max(1.0, this.walkSpeed + ctr.currZoom);
    }      
    
    keyDown(event, ctr) 
    {
        ctr.tweenStop();
        if (event.keyCode == V.KEY_W)
        {
            ctr.actionFn = this.walkFn;
        }
        else if (event.keyCode == V.KEY_S)
        {
            ctr.actionFn = this.walkFn;
        } 
        else if (event.keyCode == V.KEY_A)
        {
            ctr.actionFn = this.walkFn;
        }
        else if (event.keyCode == V.KEY_D)
        {
            ctr.actionFn = this.walkFn;
        } 
        else if (event.keyCode == V.KEY_LEFT)
        {
            ctr.setAction(this.rotateFn, -0.1, 0);
        }
        else if (event.keyCode == V.KEY_RIGHT)
        {
            ctr.setAction(this.rotateFn, 0.1, 0);
        }
        else if (event.keyCode == V.KEY_UP)
        {
            ctr.setAction(this.panFn, 0, -0.05);
        }
        else if (event.keyCode == V.KEY_DOWN)
        {
            ctr.setAction(this.panFn, 0, 0.05);
        }
    }
    
    snapToGround(point)
    {
        this._sampleRay.origin.y = point.y - V3.Walker.HEIGHT/2.0;
        
        var offset = 0;
        var samples = 0;
        for (var i=0; i<V3.Walker.DXY.length; i++)
        {
            this._sampleRay.origin.z = point.z + V3.Walker.DXY[i].z;
            this._sampleRay.origin.x = point.x + V3.Walker.DXY[i].x;
            var distance = V.viewer.raycast(this._sampleRay, { distance: Number.POSITIVE_INFINITY }).distance;
            if (distance != Number.POSITIVE_INFINITY)
            {
                offset += distance;
                samples++;
            }
        }
        
        if (samples > 0)
        {
            point.y = point.y - offset/samples + V3.Walker.HEIGHT/2;
        }
    }
    
    toJson() 
    {
        return { name: "walker" };
    }
    
}

V3.Walker.WALK = 1;
V3.Walker.WIDTH = 0.4
V3.Walker.DXY =  [{ x: V3.Walker.WIDTH, z: V3.Walker.WIDTH }, 
                  { x: V3.Walker.WIDTH, z:-V3.Walker.WIDTH }, 
                  { x:-V3.Walker.WIDTH, z: V3.Walker.WIDTH }, 
                  { x:-V3.Walker.WIDTH, z:-V3.Walker.WIDTH }];
V3.Walker.HEIGHT = 1.7





V3.Manual = class 
{
    constructor(camera) 
    {
        this.camera = camera;
    }
    
    init(config, ctr)
    {
    }
    
    target(point, ctr)
    {
    };

}

/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { 
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  HemisphereLight,
  DirectionalLight,
  MeshStandardMaterial,
  Mesh,
  Vector3
} from "three";
import { ArcballControls } from "three/examples/jsm/controls/ArcballControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

export class STLViewer extends HTMLElement {

  #observer;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.canvas = document.createElement("canvas");
    this.shadowRoot.appendChild(this.canvas);
    
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      :host {
        display: block;
        width: 100%;
        height: 100%; 
        background-color: transparent;
        color: #6699ff;
      }
    `);
    this.shadowRoot.adoptedStyleSheets = [sheet];
    
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(60, 1, 0.1, 1000);
    this.renderer = new WebGLRenderer({ 
      canvas: this.canvas, 
      antialias: true, 
      alpha: true
    });

    this.controls = new ArcballControls(
      this.camera, 
      this.canvas, 
      this.scene
    );
    this.controls.rotateSpeed = 2.0;
    this.controls.zoomSpeed = 0.5;
    this.controls.panSpeed = 0.1;
    this.controls.dampingFactor = 0.5;

    const hemiLight = new HemisphereLight(0xffffff, 0x444444, 1.2);
    hemiLight.position.set(0, 200, 0);
    this.scene.add(hemiLight);

    const dirLight = new DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 100, 100);
    this.scene.add(dirLight);
    
    this.animate = this.animate.bind(this);
    this.resize = this.resize.bind(this);
    this.#observer = new IntersectionObserver(this.#onIntersect.bind(this), {
      threshold: 0.2
    });
  }
  
  get src(){ 
    return this.getAttribute("src"); 
  }
  
  set src(value){
    this.setAttribute("src", value);
  }
  
  get pan(){ 
    return this.getAttribute("pan"); 
  }
  
  set pan(value){
    this.setAttribute("pan", value);
  }
  
  get zoom(){ 
    return this.getAttribute("zoom"); 
  }
  
  set zoom(value){
    this.setAttribute("zoom", value);
  }

  get rotate(){ 
    return this.getAttribute("rotate"); 
  }
  
  set rotate(value){
    this.setAttribute("rotate", value);
  }
  
  get inertia(){ 
    return this.getAttribute("inertia"); 
  }
  
  set inertia(value){
    this.setAttribute("inertia", value);
  }
  
  get gizmos(){ 
    return this.getAttribute("gizmos"); 
  }
  
  set gizmos(value){
    this.setAttribute("gizmos", value);
  }

  static get observedAttributes(){
    return ["src", "gizmos", "pan", "zoom", "rotate", "inertia"];
  }
  
  attributeChangedCallback(name, old, value){
    if (old !== value && value){
      if (name === "src") {
        this.dispatchEvent(new CustomEvent("change"));
        this.#onLoad(value);
        return;
      }
      if (value === "on" || value === "off") {
        this.dispatchEvent(new CustomEvent("controls"));
        switch(name){
          case "pan": {
            this.controls.enablePan = value === "on";
            break;
          }
          case "zoom": {
            this.controls.enableZoom = value === "on";
            break;
          }
          case "rotate": {
            this.controls.enableRotate = value === "on";
            break;
          }
          case "inertia": {
            this.controls.enableAnimations = value === "on";
            break;
          }
          case "gizmos": {
            this.controls.setGizmosVisible(value === "on");
            break;
          }
        }
      }  
    }
  }

  connectedCallback() {
    if (!this.getAttribute("pan")) this.setAttribute("pan", "on");
    if (!this.getAttribute("zoom")) this.setAttribute("zoom", "on");
    if (!this.getAttribute("rotate")) this.setAttribute("rotate", "on");
    if (!this.getAttribute("inertia")) this.setAttribute("inertia", "off");
    if (!this.getAttribute("gizmos")) this.setAttribute("gizmos", "off");
  
    requestAnimationFrame(this.resize);
    window.addEventListener("resize", this.resize, false);
    this.#observer.observe(this);
  }

  disconnectedCallback() {
    this.#observer.disconnect();
    window.removeEventListener("resize", this.resize, false);
  }

  #onIntersect(entries){
    entries.map((entry) => {
      if (entry.isIntersecting && !this.frame) {
        this.dispatchEvent(new CustomEvent("requestAnimationFrame"));
        this.animate();
      } else if (!entry.isIntersecting && this.frame){
        this.dispatchEvent(new CustomEvent("cancelAnimationFrame"));
        cancelAnimationFrame(this.frame);
        this.frame = null;
      }
    });
  }

  #onLoad(url) {
    return new Promise((resolve, reject) => {
      const loader = new STLLoader();
      loader.load(url, (geometry) => {
        if (this.mesh) {
          this.scene.remove(this.mesh);
          this.mesh.geometry.dispose();
          this.mesh.material.dispose();
        }

        const rgb = getComputedStyle(this).color;
        const [r, g, b] = rgb.match(/\d+/g).map(Number);
        const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

        const material = new MeshStandardMaterial({
          color: hexColor,
          metalness: 0.1,
          roughness: 0.8
        });
        this.mesh = new Mesh(geometry, material);

        // Bounding box
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        const center = new Vector3();
        const size = new Vector3();
        box.getCenter(center);
        box.getSize(size);

        // Center model
        this.mesh.position.sub(center);
        this.scene.add(this.mesh);

        // Decide best camera orientation
        let cameraPos = new Vector3();
        const smallestDim = Math.min(size.x, size.y, size.z);
        const largestDim = Math.max(size.x, size.y, size.z);
        if (smallestDim < largestDim * 0.2) {
          if (smallestDim === size.z) {
            cameraPos.set(0, 0, 1); // look down Z
          } else if (smallestDim === size.y) {
            cameraPos.set(0, 1, 0); // look down Y
          } else {
            cameraPos.set(1, 0, 0); // look down X
          }
        } else {
          cameraPos.set(1, 1, 1);
        }
        
        // Scale camera distance based on object size
        const maxDim = Math.max(size.x, size.y, size.z);
        // Clamp zoom
        this.controls.minDistance = maxDim * 0.2;
        this.controls.maxDistance = maxDim * 2; 
        const fov = this.camera.fov * (Math.PI / 180);
        let distance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        distance *= 1.5; // padding
        
        cameraPos.normalize().multiplyScalar(distance);
        this.camera.position.copy(cameraPos);
        this.camera.lookAt(0, 0, 0);

        // Reset controls target
        this.controls.target.set(0, 0, 0);
        this.controls.update();
        return resolve();
      },
      () => {},
      (error) => {
        return reject(error);
      });
    });
  }
  
  resize() {
    const width = this.clientWidth >= 320 ? this.clientWidth : 320;
    const height = this.clientHeight >= 480 ? this.clientHeight : 480;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.dispatchEvent(new CustomEvent("resized"));
  }
  
  load(){
    return this.#onLoad(this.src);
  }
  
  animate() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.animate);
  }
}
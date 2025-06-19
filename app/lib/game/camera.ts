
import { Vec } from "../Vec";

export class CameraMe {
  public position: Vec;
  constructor(position: Vec) {
    this.position = position;
  }
  public setPosition(position: Vec) {
    this.position = position;
  }
}

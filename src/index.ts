import { $createApp, getState } from "./lux";

const Lux = {
$createApp: $createApp,
getState: getState,
};


export default Lux;
(<any>globalThis).Lux = Lux;

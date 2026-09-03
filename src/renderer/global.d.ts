import { MiniDiaryApi } from "../shared/ipc";

declare global {
	interface Window {
		miniDiary: MiniDiaryApi;
	}
}

export {};

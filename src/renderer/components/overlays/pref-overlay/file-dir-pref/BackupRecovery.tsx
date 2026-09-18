import React, { ReactElement, useEffect, useState } from "react";
import { lang } from "../../../../utils/i18n";
import { flushPersistence } from "../../../../utils/persistence";

/** Restore a validated encrypted snapshot, then reload to clear stale editor and search state. */
export default function BackupRecovery(): ReactElement {
	const [backups, setBackups] = useState<string[]>([]);
	const [selected, setSelected] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const zh = lang.startsWith("zh");
	useEffect(() => {
		void window.miniDiary.diary
			.listBackups()
			.then(setBackups)
			.catch((reason) => setError(reason.message));
	}, []);
	const restore = async (): Promise<void> => {
		setBusy(true);
		setError("");
		try {
			await flushPersistence();
			await window.miniDiary.diary.restoreBackup(selected, password);
			window.location.reload();
		} catch (reason) {
			setError(reason.message);
			setBusy(false);
		}
	};
	return (
		<fieldset className="backup-recovery">
			<legend>{zh ? "备份与恢复" : "Backups & recovery"}</legend>
			<p>
				{zh
					? "保留最近 10 份加密快照。恢复前会备份当前文件；旧快照可能需要旧密码。"
					: "Keeps 10 encrypted snapshots. Recovery first backs up the current file; older snapshots may need the previous password."}
			</p>
			<select
				aria-label={zh ? "选择备份" : "Choose backup"}
				value={selected}
				onChange={(event) => setSelected(event.target.value)}
			>
				<option value="">{zh ? "选择备份" : "Choose backup"}</option>
				{backups.map((name) => (
					<option key={name} value={name}>
						{new Date(Number(name.split("-")[0])).toLocaleString(lang)}
					</option>
				))}
			</select>
			<input
				type="password"
				aria-label={zh ? "备份密码" : "Backup password"}
				placeholder={zh ? "备份密码" : "Backup password"}
				value={password}
				onChange={(event) => setPassword(event.target.value)}
			/>
			<button
				type="button"
				className="button"
				disabled={busy || !selected || !password}
				onClick={restore}
			>
				{zh ? "恢复备份" : "Restore backup"}
			</button>
			{error && <p role="alert">{error}</p>}
		</fieldset>
	);
}

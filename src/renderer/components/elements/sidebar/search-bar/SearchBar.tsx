import SearchIcon from "feather-icons/dist/icons/search.svg";
import ClearIcon from "feather-icons/dist/icons/x.svg";
import debounce from "lodash.debounce";
import { Moment } from "moment-timezone";
import React, { ChangeEvent, PureComponent, ReactNode } from "react";

import TodayIcon from "../../../../assets/icons/today.svg";
import { createDate } from "../../../../utils/dateFormat";
import { translations } from "../../../../utils/i18n";
import { iconProps } from "../../../../utils/icons";

export interface StateProps {
	dateSelected: Moment;
	searchKey: string;
}

export interface DispatchProps {
	search: (searchKey: string) => void;
	setDateSelected: (date: Moment) => void;
}

type Props = StateProps & DispatchProps;

interface State {
	newSearchKey: string;
}

export default class SearchBar extends PureComponent<Props, State> {
	updateSearchKeyDebounced: ReturnType<typeof debounce>;

	constructor(props: Props) {
		super(props);

		this.state = { newSearchKey: props.searchKey };
		this.onChange = this.onChange.bind(this);
		this.onTodaySelection = this.onTodaySelection.bind(this);
		this.clearSearchKey = this.clearSearchKey.bind(this);
		this.updateSearchKey = this.updateSearchKey.bind(this);
		this.updateSearchKeyDebounced = debounce(this.updateSearchKey, 500);
	}

	componentWillUnmount(): void {
		this.updateSearchKeyDebounced.cancel();
	}

	onChange(e: ChangeEvent<HTMLInputElement>): void {
		const newSearchKey = e.target.value;
		this.setState({ newSearchKey });
		if (newSearchKey === "") this.updateSearchKey(newSearchKey);
		this.updateSearchKeyDebounced(newSearchKey);
	}

	onTodaySelection(): void {
		const { setDateSelected } = this.props;
		setDateSelected(createDate());
	}

	clearSearchKey(): void {
		this.updateSearchKeyDebounced.cancel();
		this.setState({ newSearchKey: "" });
		this.updateSearchKey("");
	}

	updateSearchKey(newSearchKey: string): void {
		const { search } = this.props;
		search(newSearchKey);
	}

	render(): ReactNode {
		const { newSearchKey } = this.state;

		return (
			<div className="view-selector">
				<div className="search-input-wrapper">
					<SearchIcon className="search-input-icon" {...iconProps} />
					<input
						type="search"
						className="search-input"
						placeholder={`${translations.search}…`}
						aria-label={translations.search}
						spellCheck={false}
						value={newSearchKey}
						onChange={this.onChange}
					/>
					{newSearchKey !== "" && (
						<span className="search-input-clear">
							<button
								type="button"
								className="button button-invisible"
								aria-label={translations.clear}
								onClick={this.clearSearchKey}
							>
								<ClearIcon {...iconProps} title={translations.clear} />
							</button>
						</span>
					)}
				</div>
				<button
					type="button"
					className="button button-invisible button-today"
					aria-label={translations.today}
					title={translations.today}
					onClick={this.onTodaySelection}
				>
					<TodayIcon {...iconProps} title={translations.today} />
				</button>
			</div>
		);
	}
}

import { Moment } from "moment-timezone";
import React, { PureComponent, ReactNode } from "react";

import { Entries } from "../../../../types";
import { fromIndexDate, toDateString } from "../../../../utils/dateFormat";
import { translations } from "../../../../utils/i18n";
import Banner from "../../general/banner/Banner";

export interface StateProps {
	dateSelected: Moment;
	entries: Entries;
	searchResults: string[];
}

export interface DispatchProps {
	setDateSelected: (date: Moment) => void;
}

type Props = StateProps & DispatchProps;

export default class SearchResults extends PureComponent<Props, {}> {
	constructor(props: Props) {
		super(props);

		this.generateSearchResults = this.generateSearchResults.bind(this);
	}

	generateSearchResults(): ReactNode[] {
		const { dateSelected, entries, searchResults, setDateSelected } = this.props;

		return searchResults.reduce((results: ReactNode[], searchResult): ReactNode[] => {
			if (searchResult in entries) {
				const date = fromIndexDate(searchResult);
				const { title } = entries[searchResult];
				const isSelected = date.isSame(dateSelected, "day");
				results.push(
					<li key={searchResult} className="search-result">
						<button
							type="button"
							className={`button ${isSelected ? "button-main" : ""}`}
							onClick={(): void => setDateSelected(date)}
						>
							<p className="search-date text-faded">{toDateString(date)}</p>
							<p className={`search-title ${!title ? "text-faded" : ""}`}>
								{title || translations["no-title"]}
							</p>
						</button>
					</li>,
				);
			}
			return results;
		}, []);
	}

	render(): ReactNode {
		const searchResultsEl = this.generateSearchResults();
		return (
			<ul aria-live="polite" aria-label={`${searchResultsEl.length} ${translations.search}`} className="search-results">
				{searchResultsEl.length === 0 ? (
					<li>
						<Banner
							bannerType="info"
							message={translations["no-results"]}
							className="banner-no-results"
						/>
					</li>
				) : (
					searchResultsEl
				)}
			</ul>
		);
	}
}

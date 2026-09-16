import { Moment } from "moment-timezone";
import React, { PureComponent, ReactNode } from "react";

import { Entries } from "../../../../types";
import { fromIndexDate, toDateString } from "../../../../utils/dateFormat";
import { translations } from "../../../../utils/i18n";
import Banner from "../../general/banner/Banner";

function highlight(text: string, query: string): ReactNode {
	const position = text.toLocaleLowerCase().indexOf(query.trim().toLocaleLowerCase());
	if (!query.trim() || position < 0) return text;
	return (
		<>
			{text.slice(0, position)}
			<mark>{text.slice(position, position + query.trim().length)}</mark>
			{text.slice(position + query.trim().length)}
		</>
	);
}

export interface StateProps {
	searchKey: string;
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
		const { dateSelected, entries, searchResults, setDateSelected, searchKey } = this.props;

		return searchResults.reduce((results: ReactNode[], searchResult): ReactNode[] => {
			if (searchResult in entries) {
				const date = fromIndexDate(searchResult);
				const { title, text } = entries[searchResult];
				const position = text.toLocaleLowerCase().indexOf(searchKey.trim().toLocaleLowerCase());
				const start = Math.max(0, position - 25);
				const summary = `${start ? "…" : ""}${text.slice(start, start + 100).replace(/\s+/g, " ")}`;
				const isSelected = date.isSame(dateSelected, "day");
				results.push(
					<li key={searchResult} className="search-result">
						<button
							type="button"
							className={`button ${isSelected ? "button-main" : ""}`}
							aria-current={isSelected ? "date" : undefined}
							onClick={(): void => setDateSelected(date)}
						>
							<p className="search-date text-faded">{toDateString(date)}</p>
							<p className={`search-title ${!title ? "text-faded" : ""}`}>
								{highlight(title || translations["no-title"], searchKey)}
							</p>
							<p className="search-summary">{highlight(summary, searchKey)}</p>
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
			<ul
				aria-live="polite"
				aria-label={`${searchResultsEl.length} ${translations.search}`}
				className="search-results"
			>
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

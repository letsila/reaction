import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import { Tracker } from "meteor/tracker";
import _ from "lodash";
import { composeWithTracker } from "/lib/api/compose";
import * as Collections from "/lib/collections";
import SearchModal from "../components/searchModal";


class SearchModalContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: "",
      tags: [],
      productResults: []
    };
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.dep = new Tracker.Dependency;
  }

  componentDidMount() {
    Tracker.autorun(() => {
      this.dep.depend();
      this.subscription = Meteor.subscribe("SearchResults", "products", this.state.value, []);

      if (this.subscription.ready()) {
        const productResults = Collections.ProductSearch.find().fetch();
        this.setState({ productResults });

        const productHashtags = getProducts(productResults);
        const tagSearchResults = Collections.Tags.find({
          _id: { $in: productHashtags }
        }).fetch();
        this.setState({
          tags: tagSearchResults
        });
      }
    });
  }

  componentWillUnmount() {
    this.subscription.stop();
  }

  handleChange = (event, value) => {
    this.setState({ value }, () => {
      this.dep.changed();
    });
  }

  handleClick = () => {
    this.setState({
      value: ""
    }, () => {
      this.dep.changed();
    });
  }

  render() {
    return (
      <div>
        <SearchModal
          {...this.props}
          handleChange={this.handleChange}
          handleClick={this.handleClick}
          products={this.state.productResults}
          tags={this.state.tags}
          value={this.state.value}
        />
      </div>
    );
  }
}

function getSiteName() {
  const shop = Collections.Shops.findOne();
  return typeof shop === "object" && shop.name ? shop.name : "";
}

function getProducts(productResults) {
  const hashtags = [];
  for (const product of productResults) {
    if (product.hashtags) {
      for (const hashtag of product.hashtags) {
        if (!_.includes(hashtags, hashtag)) {
          hashtags.push(hashtag);
        }
      }
    }
  }
  return hashtags;
}

function composer(props, onData) {
  const siteName = getSiteName();

  onData(null, {
    siteName
  });
}

export default composeWithTracker(composer)(SearchModalContainer);

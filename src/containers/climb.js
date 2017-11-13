import React, { Component } from 'react';
import { fetchSessionGraph, scorePrevPage, postPrevPageAnnotation, scoreNextPage, postNextPageAnnotation, transitionToSession, resetNextSessionTrigger, updateMuzicodes } from '../actions/index';
import { connect } from 'react-redux' ;
import { bindActionCreators } from 'redux';
import { withRouter } from 'react-router';
import Score from '../containers/score';

const muzicodesUri = "http://localhost:3000/input"

class Climb extends Component {
	monitorKeys(event) { 
		if(event.keyCode === "39") { 
			alert("WOOOOOOP");
		}
	}
	constructor(props) { 
		super(props);
	}
	
	componentDidMount() { 
		if(this.props.location.query.session) { 
			this.props.updateMuzicodes(muzicodesUri, this.props.location.query.session);
			// start polling
			this.doPoll();
		}
		
	}

	doPoll() { 
		const graphUri = this.props.location.query.session;
		if('etags' in this.props.graph && 
		graphUri in this.props.graph.etags) { 
				this.props.fetchSessionGraph(graphUri, this.props.graph.etags[graphUri]);
		} else { 
			this.props.fetchSessionGraph(graphUri);
		}
		setTimeout(() => this.doPoll(), 200);
	}

	render() {
		if(this.props.score.publishedScores) {
			if(this.props.score.triggerNextSession) { 
				// have we got a next session queued up?
				if(this.props.graph.nextSession) { 
					this.props.transitionToSession(
						this.props.graph.annoGraph["@id"], 
						this.props.graph.nextSession
					)
					return <div>Loading next session...</div>
				} else { 
				// if not, ignore this request and reset trigger
					this.props.resetNextSessionTrigger();
				}
			}
			console.log("Climb props: ", this.props);
		//if(this.props.graph.targetsById) {
			let session = "";
			let etag = "";
			if (this.props.graph && this.props.graph.annoGraph) { 
				session = this.props.graph.annoGraph["@id"];
				etag = this.props.graph.etags[session];
				console.log("session: ", session, " etag: ", etag, " etags: ", this.props.graph.etags);
			}

			const byId = this.props.graph.targetsById;
			const publishedScores = this.props.score.publishedScores;
			const conceptualScores = this.props.score.conceptualScores;

			const scores = Object.keys(publishedScores).map((pS) => {
				console.log("MAP ON PS: ", pS);
				//return <Score key={ sc } uri={ sc } annotations={ byId[sc]["annotations"] } />;
				const cS = publishedScores[pS];
				const annotationTargets = conceptualScores[cS];
				const currentCSPretty = cS.substring(cS.lastIndexOf('/')+1);
				const nextSession = this.props.graph.nextSession;
				const nextSessionPretty = nextSession ? nextSession.substring(nextSession.lastIndexOf('/')+1) : ""; 
				annotations = Object.keys(byId).map((t) => {
					if(annotationTargets && annotationTargets.includes(t)) { 
						return byId[t].annotations
					}
				});
				console.log("Flattening array:", annotations)
				annotations = annotations.reduce( (a, b) => a.concat(b), []);
				console.log("WORKING WITH (flattened):", annotations);

				return (
					<div key={ "wrapper" + pS } onKeyDown={() => {alert("HELLO")}}>
						<div id="indicatorBar">
							<button id="prevButton" key={ "prev"+pS } onClick={() => {
								console.log("prev clicked, ps: ", pS, this.props.score.pageNum, this.props.score.MEI);
								this.props.postPrevPageAnnotation(session, etag);
							}}> Previous </button>
							<button id="nextButton" key={ "next"+pS } onClick={() => {
								console.log("next clicked, ps: ", pS, this.props.score.pageNum, this.props.score.MEI);
								this.props.postNextPageAnnotation(session, etag);
							}}> Next </button>
							<span id="indicator">
								Current: <span id="indicatorCurrent"> { currentCSPretty} </span> | 
								Page { this.props.score.pageNum } of { this.props.score.pageCount } | 
								Queued: <span id="indicatorQueued"> { nextSessionPretty } </span> 
							</span>
						</div>
					<Score key={ pS } uri={ pS } annotations={ annotations } session={ session } etag={ etag } nextSession = { this.props.nextSession } />
					
					</div>
				)
			});
			return (
				<div>
					<link rel="stylesheet" href="../../style/climb.css" type="text/css" />
					<div id="annotations"></div>
					{ scores }
				</div>
			)
		}
		return (<div>Loading...</div>);
	}

}

function mapStateToProps({ graph, score}) {
	return { graph, score }
}

function mapDispatchToProps(dispatch) { 
	return bindActionCreators({ fetchSessionGraph, scorePrevPage, postPrevPageAnnotation, scoreNextPage, postNextPageAnnotation, transitionToSession, resetNextSessionTrigger, updateMuzicodes }, dispatch);
}

withRouter(Climb);

export default connect(mapStateToProps, mapDispatchToProps)(Climb);

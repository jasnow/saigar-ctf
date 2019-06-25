/* eslint-disable no-return-assign */
/* eslint-disable react/no-multi-comp */
/* eslint-disable class-methods-use-this, no-unused-expressions */
import React from 'react'
import PropTypes from 'prop-types'
import { Query, Mutation, Subscription } from 'react-apollo'
import {
  Tabs,
  Tab,
  Card,
  Elevation,
  Tag,
  Button,
  Toaster,
  Position,
  H5,
  HTMLSelect,
  MenuItem
} from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import { ItemRenderer, MultiSelect } from '@blueprintjs/select'

import gql from 'graphql-tag'

import ScoreGraph from '../../../features/ScoreGraph'
import {
  HOME_QUERY,
  SUBMISSION_HISTORY,
  PROCESS_SUBMISSION,
  SUBMISSION_FILTERS,
} from './graphql/adminQueries'
import Can from '../../../shared/components/AuthContext/Can'
import { AuthConsumer } from '../../../shared/components/AuthContext/context'

import './index.scss'

class Countdown extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      days: 0,
      hours: 0,
      min: 0,
      sec: 0,
    }
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      const { date: dateProp } = this.props
      const date = this.calculateCountdown(dateProp)
      date ? this.setState(date) : this.stop()
    }, 1000)
  }

  componentWillUmount() {
    this.stop()
  }

  calculateCountdown(endDate) {
    let diff = (Date.parse(new Date(endDate)) - Date.parse(new Date())) / 1000

    // clear countdown when date is reached
    if (diff <= 0) return false

    const timeLeft = {
      years: 0,
      days: 0,
      hours: 0,
      min: 0,
      sec: 0,
      millisec: 0,
    }

    // calculate time difference between now and expected date
    if (diff >= 365.25 * 86400) {
      // 365.25 * 24 * 60 * 60
      timeLeft.years = Math.floor(diff / (365.25 * 86400))
      diff -= timeLeft.years * 365.25 * 86400
    }
    if (diff >= 86400) {
      // 24 * 60 * 60
      timeLeft.days = Math.floor(diff / 86400)
      diff -= timeLeft.days * 86400
    }
    if (diff >= 3600) {
      // 60 * 60
      timeLeft.hours = Math.floor(diff / 3600)
      diff -= timeLeft.hours * 3600
    }
    if (diff >= 60) {
      timeLeft.min = Math.floor(diff / 60)
      diff -= timeLeft.min * 60
    }
    timeLeft.sec = diff

    return timeLeft
  }

  stop() {
    clearInterval(this.interval)
  }

  addLeadingZeros(value) {
    let newValue = String(value)
    while (newValue.length < 2) {
      newValue = `0${newValue}`
    }
    return newValue
  }

  render() {
    const countDown = this.state

    return (
      <div className="Countdown" style={{ textAlign: 'center' }}>
        <span className="Countdown-col">
          <span className="Countdown-col-element">
            <span style={{ fontWeight: 350, fontSize: '2.5em', color: 'rgb(92, 112, 128)' }}>
              {this.addLeadingZeros(countDown.days)}
            </span>
            <span>{countDown.days === 1 ? 'Day' : 'Days'}</span>
          </span>
        </span>

        <span className="Countdown-col">
          <span className="Countdown-col-element">
            <span style={{ fontWeight: 350, fontSize: '2.5em', color: 'rgb(92, 112, 128)' }}>
              {this.addLeadingZeros(countDown.hours)}
            </span>
            <span>Hours</span>
          </span>
        </span>

        <span className="Countdown-col">
          <span className="Countdown-col-element">
            <span style={{ fontWeight: 350, fontSize: '2.5em', color: 'rgb(92, 112, 128)' }}>
              {this.addLeadingZeros(countDown.min)}
            </span>
            <span>Min</span>
          </span>
        </span>

        <span className="Countdown-col">
          <span className="Countdown-col-element">
            <span style={{ fontWeight: 350, fontSize: '2.5em', color: 'rgb(92, 112, 128)' }}>
              {this.addLeadingZeros(countDown.sec)}
            </span>
            <span>Sec</span>
          </span>
        </span>
      </div>
    )
  }
}

Countdown.propTypes = {
  date: PropTypes.objectOf(Date).isRequired,
}

/* TODO(peter): This code is duplicated, should be extracted to a shared component */
const FeedToaster = Toaster.create({
  classname: 'feed-toaster',
  position: Position.TOP_LEFT,
})

const ShareButton = class extends React.PureComponent {
  copySubmissionUrl = e => {
    this.textArea.select()
    document.execCommand('copy')
    e.target.focus()

    FeedToaster.show({ message: 'Shareable link copied successfully!' })
  }

  render() {
    const { uuid } = this.props
    return (
      <React.Fragment>
        <Button
          intent="primary"
          large
          icon={IconNames.CLIPBOARD}
          onClick={this.copySubmissionUrl}
          style={{ marginRight: 10 }}
        >
          Share
        </Button>
        <textarea
          ref={textArea => (this.textArea = textArea)}
          readOnly
          value={`${window.location.protocol}//${window.location.hostname}/submission/${uuid}`}
          style={{ position: 'absolute', zIndex: '-1', height: 0, opacity: '0.01' }}
        />
      </React.Fragment>
    )
  }
}
ShareButton.propTypes = {
  uuid: PropTypes.string.isRequired,
}
/* -- END -- */

/* TODO(peter): This code is duplicated, can also be extracted */
const SUBMISSION_DETAILS = gql`
  query submissionConfig {
    submission_configuration {
      uuid
      category
      points
    }
  }
`

const CategoryList = ({ currentCategory, handleChange }) => (
  <Query query={SUBMISSION_DETAILS} fetchPolicy="cache-first">
    {({ error, loading, data }) => {
      if (loading) return null
      if (error) return <div>{`${error.message}`}</div>

      return (
        <HTMLSelect name="category" value={currentCategory} onChange={handleChange} fill large>
          {data.submission_configuration.map(config => (
            <option key={config.uuid} id={config.category} value={config.uuid}>{`${
              config.category
            } (${config.points} pts.)`}</option>
          ))}
        </HTMLSelect>
      )
    }}
  </Query>
)

CategoryList.propTypes = {
  currentCategory: PropTypes.string.isRequired,
  handleChange: PropTypes.func.isRequired,
}
/* -- END -- */

class SubmissionItem extends React.Component {
  state = {
    // eslint-disable-next-line react/destructuring-assignment
    category: this.props.submission.submissionConfigurationByconfigId.uuid,
  }

  handleChange = e => {
    this.setState({
      category: e.currentTarget.value,
    })
  }

  render() {
    const { submission } = this.props
    const { category } = this.state

    return (
      <Card style={{ marginBottom: 20 }}>
        <div style={{ width: '100%', display: 'inline-flex' }}>
          <div style={{ flexGrow: 1 }}>
            <H5>{submission.processed}</H5>
          </div>
          <div>
            <CategoryList currentCategory={category} handleChange={this.handleChange} />
          </div>
        </div>
        <code style={{ background: '#cdcdcd' }}>
          <p>{submission.content}</p>
          <p style={{ wordWrap: 'break-word' }}>{submission.explanation}</p>
        </code>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Tag large style={{ marginRight: 10 }}>
              <strong>Team: </strong>
              {submission.teamByteamId.name}
            </Tag>
            <Tag large style={{ marginRight: 10 }}>
              <strong>Case: </strong>
              {submission.case.name}
            </Tag>
            <Tag large>
              <strong>Category: </strong>
              {submission.submissionConfigurationByconfigId.category}
            </Tag>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
            <ShareButton uuid={submission.uuid} />
            <Mutation mutation={PROCESS_SUBMISSION}>
              {updateSubmission => (
                <Button
                  intent="warning"
                  large
                  icon={IconNames.STAR}
                  style={{ marginRight: 10 }}
                  onClick={() =>
                    updateSubmission({
                      variables: {
                        submissionID: submission.uuid,
                        value: 'STARRED',
                        processedAt: new Date(),
                        category,
                      },
                    })
                  }
                >
                  Star
                </Button>
              )}
            </Mutation>
            <Mutation mutation={PROCESS_SUBMISSION}>
              {updateSubmission => (
                <Button
                  intent="success"
                  large
                  icon={IconNames.TICK}
                  style={{ marginRight: 10 }}
                  onClick={() =>
                    updateSubmission({
                      variables: {
                        submissionID: submission.uuid,
                        value: 'ACCEPTED',
                        processedAt: new Date(),
                        category,
                      },
                    })
                  }
                >
                  Approve
                </Button>
              )}
            </Mutation>
            <Mutation mutation={PROCESS_SUBMISSION}>
              {updateSubmission => (
                <Button
                  intent="danger"
                  large
                  icon={IconNames.CROSS}
                  onClick={() =>
                    updateSubmission({
                      variables: {
                        submissionID: submission.uuid,
                        value: 'REJECTED',
                        processedAt: new Date(),
                        category,
                      },
                    })
                  }
                >
                  Reject
                </Button>
              )}
            </Mutation>
          </div>
        </div>
      </Card>
    )
  }
}

SubmissionItem.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  submission: PropTypes.any.isRequired,
}

class HistoryData extends React.Component {
  state = { teams: null, cases: null, category: null, status: ['ACCEPTED', 'REJECTED', 'STARRED'] }

  handleSelect = e => {
    this.setState({
      [e.currentTarget.name]: e.currentTarget.value === '' ? null : e.currentTarget.value,
    })
  }

  handleStatusSelect = e => {
    this.setState({
      status: e.currentTarget.value === '' ? ['ACCEPTED', 'REJECTED', 'STARRED'] : [e.currentTarget.value],
    })
  }

  render() {
    return (
      <React.Fragment>
        <Query query={SUBMISSION_FILTERS}>
          {({ data, loading, error }) => {
            if (loading) return null
            if (error) return null

            if (!Array.isArray(data.event) || !data.event.length) {
              return <div> No Events Created Yet </div>
            }

            return (
              <div style={{ display: 'inline-flex', width: '100%', marginBottom: '20px' }}>
                <div style={{ width: '100%', marginRight: '20px' }}>
                  {/* <MultiSelect
                    itemPredicate={(query, team, _index, exactMatch) => {
                      const normalizedTeams = team.name.toLowerCase()
                      const normalizedQuery = query.toLowerCase()

                      if (exactMatch) {
                        return normalizedTeams === normalizedQuery
                      } else {
                        return `${team.name}`.indexOf(normalizedQuery) >= 0;
                      }
                    }}
                    itemRenderer={(team, { handleClick, modifiers, query }) => {
                      if (!modifiers.matchesPredicate) {
                        return null
                      }
                      const text = `${team.name}`
                      return (
                        <MenuItem active={modifiers.active} disabled={modifiers.disabled} label={team.name.toString()} key={team.uuid} onClick={() => console.log("HELLO WORLD")} text={text} />
                      )
                    }}
                    tagRenderer={team => team.name}
                    items={[
                      {
                        uuid: "1",
                        name: "Yo"
                      },
                      {
                        uuid: '2',
                        name: "Sherlock"
                      }
                    ]}
                    tagInputProps={{ large: true }}
                  /> */}
                  <HTMLSelect
                    name="teams"
                    onChange={this.handleSelect}
                    value={this.state.teams}
                    fill
                    large
                  >
                    <option value="">All Teams</option>
                    {data.event[0].team_events.map(({ team }) => (
                      <option key={team.uuid} value={team.uuid}>
                        {team.name}
                      </option>
                    ))}
                  </HTMLSelect>
                </div>
                <div style={{ width: '100%', marginRight: '20px' }}>
                  <HTMLSelect
                    name="cases"
                    onChange={this.handleSelect}
                    value={this.state.cases}
                    label="Filter Cases"
                    fill
                    large
                  >
                    <option value="">All Cases</option>
                    {data.event[0].eventCasesByeventId.map(({ case: _case }) => (
                      <option key={_case.uuid} value={_case.uuid}>
                        {_case.name}
                      </option>
                    ))}
                  </HTMLSelect>
                </div>
                <div style={{ width: '100%', marginRight: '20px' }}>
                  <Query query={SUBMISSION_DETAILS} fetchPolicy="cache-first">
                    {({ error, loading, data }) => {
                      if (loading) return null
                      if (error) return <div>{`${error.message}`}</div>

                      return (
                        <HTMLSelect name="category" value={this.state.category} onChange={this.handleSelect} label="Filter Category" fill large >
                          <option value="">Any Category</option>
                          {data.submission_configuration.map(config => (
                            <option key={config.uuid} id={config.category} value={config.uuid}>{`${
                              config.category
                            } (${config.points} pts.)`}</option>
                          ))}
                        </HTMLSelect>
                      )
                    }}
                  </Query>
                </div>
                <div style={{ width: '100%' }}>
                  <HTMLSelect
                    name="status"
                    onChange={this.handleStatusSelect}
                    value={this.state.status}
                    label="Filter Status"
                    fill
                    large
                  >
                    <option value="">Any Status</option>
                    <option value="STARRED">Starred</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="REJECTED">Rejected</option>
                  </HTMLSelect>
                </div>
              </div>
            )
          }}
        </Query>
        <Subscription
          subscription={SUBMISSION_HISTORY}
          variables={{ team: this.state.teams, case: this.state.cases, category: this.state.category, status: this.state.status }}
        >
          {({ data, loading, error }) => {
            if (loading) return <div> Loading... </div>
            if (error) return <div>Error: `${error.message}`</div>

            if (!Array.isArray(data.event) || !data.event.length) {
              return (
                <H5 style={{ textAlign: 'center' }}>
                  There is currently no history, items will appear once submissions have been
                  processed
                </H5>
              )
            }

            return data.event[0].submissions.map(submission => (
              <SubmissionItem key={submission.uuid} submission={submission} />
            ))
          }}
        </Subscription>
      </React.Fragment>
    )
  }
}

const HomePageData = () => (
  <Query query={HOME_QUERY}>
    {({ data, loading, error }) => {
      if (loading) return <div>Loading...</div>
      if (error) return <div>Error: `${error.message}`</div>

      if (!Array.isArray(data.event) || !data.event.length) {
        return <div>No Created Events</div>
      }

      const eventName = data.event[0].name
      const startTime = new Date(data.event[0].start_time)

      return (
        <div>
          <div className="row" style={{ marginBottom: '10px' }}>
            <div style={{ padding: '1rem', display: 'inline-flex', flexGrow: 1 }}>
              <div className="col-xs">
                <Card
                  elevation={Elevation.ONE}
                  style={{ backgroundColor: '#FFFFFF', color: '#394B59', height: '100%' }}
                >
                  <AuthConsumer>
                    {({ user }) => (
                      <h1 style={{ color: '#5C7080', fontWeight: '350', textAlign: 'center' }}>
                        Welcome, {user.nickname}!
                      </h1>
                    )}
                  </AuthConsumer>
                </Card>
              </div>

              <div className="col-xs">
                <Card
                  elevation={Elevation.ONE}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#394B59',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    flexDirection: 'column',
                  }}
                >
                  <h1 style={{ color: '#5C7080', fontWeight: '350', textAlign: 'center' }}>
                    {eventName}
                  </h1>
                  <Countdown date={startTime} />
                </Card>
              </div>
            </div>
          </div>

          <div className="row" style={{ marginBttom: '10px' }}>
            <div className="col-xs">
              <div style={{ padding: '1em' }}>
                <Tabs id="homePageTabs" renderActiveTabPanelOnly animate>
                  <Tab id="scoreboard" title="Scoreboard" panel={<ScoreGraph dark={false} />} />
                  <Tab id="history" title="History" panel={<HistoryData />} />
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      )
    }}
  </Query>
)

const HomePage = () => <Can allowedRole={['ctf_admin', 'judge']} yes={() => <HomePageData />} />

export default HomePage

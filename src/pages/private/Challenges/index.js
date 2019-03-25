import React from 'react'
import { Query } from 'react-apollo'

// Custom Components
import CaseGrid from './components/CaseGrid'
import { CASE_LIST } from './graphql/queries'
import Can from '../../../_Common/components/AuthContext/Can'

const ChallengesPage = () => (
  <Can
    role="contestant"
    yes={() => (
      <Query query={CASE_LIST}>
        {({ data, loading, error }) => {
          if (loading) return null
          if (error) return <div>{error.message}</div>

          const cases = data.case

          return (
            <div className="row">
              <div className="col-xs">
                <CaseGrid cases={cases} />
              </div>
            </div>
          )
        }}
      </Query>
    )}
  />
)

export default ChallengesPage

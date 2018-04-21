import React, { Component } from 'react';
import { Form, Button, Input } from 'semantic-ui-react';
import Layout from '../../components/Layout';

class CampaignNew extends Component {
  state = {
    minimumContribution: ''
  };

  render() {
    return (
      <Layout>
        <h3>Create a Campaign</h3>
        <Form>
          <Form.Field>
            <label>Minimum Contribution</label>
            <Input
              label="wei"
              labelPosition="right"
              value={this.state.minimumContribution}
              onChange={e => {
                this.setState({ minimumContribution: e.target.value })
              }}
            />
          </Form.Field>
          <Button type="submit" primary>Create!</Button>
        </Form>
      </Layout>
    )
  }
}

export default CampaignNew;
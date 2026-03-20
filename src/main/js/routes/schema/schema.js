import React, { useState } from "react";
import { useOutletContext, useParams, useSearchParams } from "react-router-dom";
import TabView from "../../components/tabs/tab-view";
import Preview from "./preview";
import Query, { defaultQuery } from "./query";
import QueryHistory from "./query-history";
import SyntaxHighlighter from "react-syntax-highlighter";
import { androidstudio } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import Documents from "./documents";

function Schema() {
  const vespaState = useOutletContext();
  const params = useParams();
  const containerUrl = getQueryableContainer(vespaState);
  const feedContainerUrl = getFeedableContainer(vespaState) || containerUrl;
  const schema = params.schema;
  const schemaDetails = findSchemaDetails(vespaState, schema);
  const [tabIndex, setTabIndex] = useState(0);
  const [editDocument, setEditDocument] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const DOCUMENTS_TAB_INDEX = 3;

  function handleEditDocument(rowData) {
    setEditDocument(rowData);
    setTabIndex(DOCUMENTS_TAB_INDEX);
  }

  return (
    <>
      <TabView
        tabs={[
          {
            header: "Query",
            content: (
              <Query
                containerUrl={containerUrl}
                schema={schema}
                searchParams={searchParams}
                setSearchParams={setSearchParams}
                vespaState={vespaState}
                onEditDocument={handleEditDocument}
              />
            ),
          },
          {
            header: "Query history",
            content: (
              <QueryHistory
                schema={schema}
                tabSelector={setTabIndex}
                searchParams={searchParams}
                setSearchParams={setSearchParams}
              />
            ),
          },
          {
            header: "Data preview",
            content: (
              <Preview
                containerUrl={containerUrl}
                schema={schema}
                onEditDocument={handleEditDocument}
              />
            ),
          },
          {
            header: "Documents",
            content: (
              <Documents
                containerUrl={feedContainerUrl}
                schema={schema}
                editDocument={editDocument}
                onEditConsumed={() => setEditDocument(null)}
              />
            ),
          },
          {
            header: "Schema",
            content: (
              <SyntaxHighlighter language="yaml" style={androidstudio}>
                {schemaDetails}
              </SyntaxHighlighter>
            ),
          },
        ]}
        currentTab={tabIndex}
        tabSelector={setTabIndex}
      />
    </>
  );

  /* finds a valid container to issue the query */
  function getQueryableContainer(vespaState) {
    const clusters = vespaState.container.clusters.filter(
      (cluster) => cluster.canSearch === true,
    );

    if (
      clusters &&
      clusters.length > 0 &&
      clusters[0].nodes &&
      clusters[0].nodes.length > 0
    ) {
      return clusters[0].route;
    } else {
      return "";
    }
  }

  /* finds a valid container to issue feed/document operations */
  function getFeedableContainer(vespaState) {
    const clusters = vespaState.container.clusters.filter(
      (cluster) => cluster.canIndex === true,
    );

    if (
      clusters &&
      clusters.length > 0 &&
      clusters[0].nodes &&
      clusters[0].nodes.length > 0
    ) {
      return clusters[0].route;
    } else {
      return "";
    }
  }

  function findSchemaDetails(vespaState, schema) {
    for (let cluster of vespaState.content.clusters) {
      for (let data of cluster.contentData) {
        if (data.schema.schemaName === schema) {
          return data.schema.schemaContent;
        }
      }
    }
  }
}

export default Schema;

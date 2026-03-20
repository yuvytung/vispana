package com.vispana.api;

import com.vispana.api.model.VispanaRoot;
import com.vispana.vespa.document.VespaDocumentClient;
import com.vispana.vespa.query.VespaQueryClient;
import com.vispana.vespa.state.VespaStateClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MainController {

  private final VespaStateClient vespaStateClient;
  private final VespaQueryClient vespaQueryClient;
  private final VespaDocumentClient vespaDocumentClient;

  @Autowired
  public MainController(
    VespaStateClient vespaStateClient,
    VespaQueryClient vespaQueryClient,
    VespaDocumentClient vespaDocumentClient
  ) {
    this.vespaStateClient = vespaStateClient;
    this.vespaQueryClient = vespaQueryClient;
    this.vespaDocumentClient = vespaDocumentClient;
  }

  @GetMapping(value = "/api/overview", produces = { "application/json" })
  @ResponseBody
  public VispanaRoot root(
    @RequestParam(name = "config_host") String configHost
  ) {
    return vespaStateClient.vespaState(configHost);
  }

  @PostMapping(value = "/api/query", produces = { "application/json" })
  @ResponseBody
  public String query(
    @RequestParam(name = "container_host") String containerHost,
    @RequestBody String query
  ) {
    return vespaQueryClient.query(containerHost, query);
  }

  @PostMapping(value = "/api/document/save", produces = { "application/json" })
  @ResponseBody
  public String updateDocument(
    @RequestParam(name = "container_host") String containerHost,
    @RequestParam(name = "namespace") String namespace,
    @RequestParam(name = "document_type") String documentType,
    @RequestParam(name = "document_id") String documentId,
    @RequestBody String documentJson
  ) {
    return vespaDocumentClient.postDocument(
      containerHost,
      namespace,
      documentType,
      documentId,
      documentJson
    );
  }

  @DeleteMapping(
    value = "/api/document/delete",
    produces = { "application/json" }
  )
  @ResponseBody
  public String deleteDocument(
    @RequestParam(name = "container_host") String containerHost,
    @RequestParam(name = "namespace") String namespace,
    @RequestParam(name = "document_type") String documentType,
    @RequestParam(name = "document_id") String documentId
  ) {
    return vespaDocumentClient.deleteDocument(
      containerHost,
      namespace,
      documentType,
      documentId
    );
  }

  @GetMapping(value = "/api/document/get", produces = { "application/json" })
  @ResponseBody
  public String getDocument(
    @RequestParam(name = "container_host") String containerHost,
    @RequestParam(name = "namespace") String namespace,
    @RequestParam(name = "document_type") String documentType,
    @RequestParam(name = "document_id") String documentId
  ) {
    return vespaDocumentClient.getDocument(
      containerHost,
      namespace,
      documentType,
      documentId
    );
  }
}

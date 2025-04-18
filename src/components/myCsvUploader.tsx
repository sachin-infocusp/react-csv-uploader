import React, { ReactNode, useState } from "react";

import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  TablePagination,
  Button,
} from "@mui/material";

import { BarChart } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import Loader from "./loading";
import DownloadIcon from "./custom-icons/downloadIcon";

interface ColumnConfig {
  name: string;
  required: boolean;
  validate?: (value: string) => boolean;
  description?: string;
}

interface CSVUploaderProps {
  title: string;
  typeOfData?: string | null;
  overallDescription?: ReactNode | null;
  columnConfigs?: ColumnConfig[];
  maxSizeMB?: number | null;
  validator?: (data: Record<string, string>[]) => string | null;
  onUpload?: (validData: Record<string, string>[]) => void;
  alreadyUploadedPath?: string | null;
  onDelete?: () => void;
  dataFetcher?: () => Promise<Record<string, string>[]>;
}

export default function MyCsvUploader({
  title,
  typeOfData = null,
  overallDescription = null,
  columnConfigs = [],
  maxSizeMB = null,
  validator = () => null,
  onUpload = () => null,
  alreadyUploadedPath = null,
  onDelete = () => null,
  dataFetcher = () => Promise.resolve([]),
}: CSVUploaderProps) {
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);

  const [errors, setErrors] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const [showUploadedDataTable, setShowUploadedDataTable] = useState(false);

  const maxSize = maxSizeMB ? maxSizeMB * 1024 * 1024 : null;

  const onDrop = (acceptedFiles: File[]) => {
    setErrors([]);
    setFileError(null);
    const file = acceptedFiles[0];

    if (!file) return;

    if (maxSize && file.size > maxSize) {
      setFileError(
        `File exceeds maximum size of ${(maxSize / 1024 / 1024).toFixed(2)}MB.`
      );
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        const allErrors: string[] = [];

        const validated = data.filter((row, index) => {
          let valid = true;

          columnConfigs.forEach((col) => {
            const val = row[col.name]?.trim();
            if (col.required && !val) {
              allErrors.push(
                `Row ${index + 2}: Missing required field "${col.name}".`
              );
              valid = false;
            }
            if (val && col.validate && !col.validate(val)) {
              allErrors.push(
                `Row ${index + 2}: Invalid value in "${col.name}".`
              );
              valid = false;
            }
          });

          return valid;
        });

        if (allErrors.length > 0) {
          setErrors(allErrors);
        } else {
          const validationErr = validator(validated);
          if (validationErr) {
            setErrors([validationErr]);
          } else {
            setParsedData(validated);
            setUploadedFileName(file.name);
            setUploadedFileSize((file.size / (1024 * 1024)).toFixed(4));

            onUpload(validated);
          }
        }
      },
      error: (error) => {
        setFileError(`Parsing error: ${error.message}`);
      },
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  const downloadTemplate = () => {
    const headerRow = columnConfigs.map((h) => h.name).join(",");
    const csvContent = `data:text/csv;charset=utf-8,${headerRow}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  function handleDeleteData() {
    const message = `Are you sure to remove all your ${
      typeOfData || "uploaded"
    } data?`;
    if (window.confirm(message)) {
      setParsedData([]);
      setUploadedFileName(null);
      setShowUploadedDataTable(false);
      onDelete();
    }
  }

  function handleVisualizeData() {
    setShowUploadedDataTable(true);
    if (alreadyUploadedPath)
      dataFetcher()
        .then((fetchedData: Record<string, string>[]) => {
          setParsedData(fetchedData);
        })
        .catch((error) => {
          console.log("Error fetching data:", error);
        });
  }

  return (
    <div className="my-4 border border-gray-300 rounded-lg shadow-md">
      <div className="flex justify-center text-2xl my-2 font-bold">{title}</div>

      {alreadyUploadedPath ? (
        <div className="mb-6 ml-10">
          <p className="text-xl my-4">{`Your ${
            typeOfData || ""
          } data is saved at: ${alreadyUploadedPath}`}</p>
        </div>
      ) : (
        <div className="flex">
          <div className="items-center mx-2 w-1/2 mb-4">
            {overallDescription && <div>{overallDescription}</div>}
            {columnConfigs && columnConfigs.length > 0 && (
              <div>
                <TableContainer
                  component={Paper}
                  sx={{
                    mt: 2,
                    backgroundColor: "#F8F9FA",
                    borderRadius: "8px",
                  }}
                >
                  <div className="text-xl flex justify-center mt-4">
                    {"CSV file should contain below columns:"}
                  </div>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <div className="text-xl font-bold">#</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xl font-bold">Columns</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xl font-bold">Required</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xl font-bold">Description</div>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {columnConfigs.map((col, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{col.name}</TableCell>
                          <TableCell>
                            {col.required ? "✔" : "Optional"}
                          </TableCell>
                          <TableCell>{col.description || ""}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>
            )}
          </div>

          <div className="items-center mx-2 w-1/2">
            <div className="my-2">
              <Box
                {...getRootProps()}
                sx={{
                  border: "2px dashed #2196f3",
                  borderRadius: "8px",
                  padding: "20px",
                  textAlign: "center",
                  backgroundColor: isDragActive ? "#e3f2fd" : "#fafafa",
                  cursor: "pointer",
                  minHeight: "100px",
                }}
              >
                <input {...getInputProps()} />
                <div className="text-xl items-center">
                  {isDragActive
                    ? "Drop the file here..."
                    : "Drag and drop a CSV file here, or click to select."}
                </div>
              </Box>
            </div>
            {maxSizeMB && (
              <div className="flex justify-center text-red-900">{`Maximum file size: ${maxSizeMB} MB`}</div>
            )}

            <div className="flex justify-center mt-10">
              <Box mb={2}>
                <Button onClick={downloadTemplate}>
                  <DownloadIcon className="mr-2 h-6 w-6" />
                  <p className="text-xl text-green-900">Download Template</p>
                </Button>
              </Box>
            </div>
          </div>
        </div>
      )}

      {fileError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {fileError}
        </Alert>
      )}
      {errors.length > 0 && (
        <div className="my-4 max-h-96 overflow-auto mx-4">
          <Alert severity="error">
            <Typography>
              <strong>Validation Errors:</strong>
            </Typography>
            <ul>
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </Alert>
        </div>
      )}

      {(alreadyUploadedPath || parsedData.length > 0) && (
        <>
          {!alreadyUploadedPath && (
            <div className="flex justify-center text-xl text-green-900 mb-4">{`File ${uploadedFileName} (${uploadedFileSize} MB) is uploaded ✔`}</div>
          )}
          <div className="flex justify-center mb-4">
            <button
              onClick={handleVisualizeData}
              className="bg-greenTheme px-4 py-3 gap-10 rounded-lg hover:border-slate-400 hover:text-slate-900 hover:shadow"
            >
              <div className="flex">
                <BarChart />
                <p className="text-xl">{" Visualize Your Data"}</p>
              </div>
            </button>
            <button
              onClick={handleDeleteData}
              className="ml-5 bg-red-400 px-4 py-3 gap-10 rounded-lg hover:border-slate-400 hover:text-slate-900 hover:shadow"
            >
              <div className="flex">
                <DeleteIcon />
                <p className="text-xl">{" Delete Your data"}</p>
              </div>
            </button>
          </div>

          {showUploadedDataTable && <DataTable data={parsedData} />}
        </>
      )}
    </div>
  );
}

export function DataTable({ data }: { data: Record<string, string>[] }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (!data || data.length === 0) {
    return (
      <div>
        <p className="text-xl flex justify-center">Fetching data</p>
        <Loader />
      </div>
    );
  }

  return (
    <Paper
      style={{
        marginTop: 16,
        overflow: "hidden",
        marginLeft: 20,
        marginRight: 20,
      }}
    >
      <TableContainer style={{ maxHeight: 1000, overflow: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                style={{
                  position: "sticky",
                  left: 0,
                  background: "#e0e0e0",
                  zIndex: 3,
                  fontWeight: "bold",
                  minWidth: 50,
                }}
              >
                #
              </TableCell>
              {Object.keys(data[0]).map((key, index) => (
                <TableCell
                  key={key}
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "#f0f0f0",
                    zIndex: 2,
                    fontWeight: "bold",
                    ...(index === 0 ? { left: 50, zIndex: 3 } : {}),
                  }}
                >
                  {key}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell
                    style={{
                      position: "sticky",
                      left: 0,
                      background: "#f0f0f0",
                      fontWeight: "bold",
                      zIndex: 2,
                      minWidth: 50,
                    }}
                  >
                    {page * rowsPerPage + rowIndex + 1}
                  </TableCell>
                  {Object.values(row).map((value, colIndex) => (
                    <TableCell
                      key={colIndex}
                      style={{
                        ...(colIndex === 0
                          ? {
                              position: "sticky",
                              left: 50,
                              background: "#f0f0f0",
                              fontWeight: "bold",
                              zIndex: 1,
                            }
                          : {}),
                      }}
                    >
                      {value}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </Paper>
  );
}

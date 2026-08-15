import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import { uploadDriverDocument } from "../services/upload.service";
import { strings } from "../i18n/strings";
import { toApiError } from "../api/client";
import type { DocumentType } from "../types/driver";
import { DRIVER_PROFILE_KEY } from "./useDriverProfile";

export type PickSource = "camera" | "library";

/**
 * Picks an image and pushes it through the server's three-step upload.
 *
 * `pending` is the document type currently uploading, not a boolean: the screen
 * lists five document rows and only the row being uploaded may show a spinner.
 *
 * Images are compressed to 0.7 quality before upload. A modern phone camera
 * produces 4-8 MB per shot, which a driver on 3G at the roadside cannot send;
 * a licence photo stays perfectly legible at this quality.
 */
export function useDocumentUpload() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<DocumentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (type: DocumentType, source: PickSource) => {
      setError(null);

      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(
          source === "camera"
            ? strings.documents.cameraDenied
            : strings.documents.libraryDenied,
        );
        return false;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        quality: 0.7,
        allowsEditing: false,
        exif: false,
      };
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return false;

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        setError(strings.documents.pickFailed);
        return false;
      }

      setPending(type);
      try {
        await uploadDriverDocument(type, asset.uri);
        // The profile carries the document list and the approval status, so it is
        // the single thing to invalidate.
        await queryClient.invalidateQueries({ queryKey: DRIVER_PROFILE_KEY });
        return true;
      } catch (uploadError) {
        const apiError = toApiError(uploadError);
        setError(
          apiError.offline
            ? strings.errors.network
            : apiError.message || strings.documents.uploadFailed,
        );
        return false;
      } finally {
        setPending(null);
      }
    },
    [queryClient],
  );

  return { submit, pending, error, clearError: () => setError(null) };
}

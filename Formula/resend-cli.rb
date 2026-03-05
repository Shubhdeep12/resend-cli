# typed: false
# frozen_string_literal: true

class ResendCli < Formula
  desc "CLI for Resend (resend.com)"
  homepage "https://github.com/Shubhdeep12/resend-cli"
  url "https://registry.npmjs.org/@shubhdeep12/resend-cli/-/resend-cli-0.4.14.tgz"
  sha256 "2dca1a7e3d080e0fea0f0583be136c7bd0812e76c7e3750db6a61bdc2b134b18"
  license "MIT"

  depends_on "node"

  def install
    (buildpath/"package").cd do
      system "npm", "install", *Language::Node.std_npm_args(libexec)
    end
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "resend", shell_output("#{bin}/resend --help")
  end
end
